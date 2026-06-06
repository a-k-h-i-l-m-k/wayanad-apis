import { prisma } from '../configs/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';

export interface PricingCalculationRequest {
  roomTypeId: string;
  checkIn: string; // ISO date format YYYY-MM-DD
  checkOut: string; // ISO date format YYYY-MM-DD
  adults: number;
  children: number;
  childrenAges: number[];
  extraBeds: number;
  offerId?: string;
}

export interface PriceBreakdownDay {
  date: string;
  baseRate: number;
  extraBedCharge: number;
  childCharge: number;
  subTotal: number;
  rateType: 'BASE' | 'SEASONAL' | 'SPECIAL';
  rateName: string;
}

export interface PricingCalculationResult {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  daysBreakdown: PriceBreakdownDay[];
  totalBaseAmount: number;
  totalExtraBedAmount: number;
  totalChildAmount: number;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
}

export class PricingService {
  /**
   * Determine if a date falls on a weekend (Friday and Saturday nights)
   */
  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 5 || day === 6; // 5 = Friday, 6 = Saturday
  }

  /**
   * Get the pricing details for a single room type for a range of dates
   */
  public async calculatePrice(params: PricingCalculationRequest): Promise<PricingCalculationResult> {
    const { roomTypeId, checkIn, checkOut, adults, children, childrenAges, extraBeds, offerId } = params;

    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
    });

    if (!roomType) {
      throw new NotFoundError('Room Type not found');
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      throw new BadRequestError('Check-out date must be after check-in date');
    }

    // Capacity validation
    if (adults + children > roomType.maxOccupancy) {
      throw new BadRequestError(`Total occupancy exceeds room type max capacity of ${roomType.maxOccupancy}`);
    }
    if (adults > roomType.maxAdults) {
      throw new BadRequestError(`Adult count exceeds room type max adults of ${roomType.maxAdults}`);
    }
    if (children > roomType.maxChildren) {
      throw new BadRequestError(`Child count exceeds room type max children of ${roomType.maxChildren}`);
    }
    if (extraBeds > 0 && !roomType.extraBedAllowed) {
      throw new BadRequestError('Extra beds are not allowed in this room type');
    }

    const daysBreakdown: PriceBreakdownDay[] = [];
    let totalBaseAmount = 0;
    let totalExtraBedAmount = 0;
    let totalChildAmount = 0;

    // Iterate through each night of the stay
    for (let i = 0; i < nights; i++) {
      const currentNightDate = new Date(start);
      currentNightDate.setDate(start.getDate() + i);
      const dateString = currentNightDate.toISOString().split('T')[0];

      // 1. Check Special Rates (Highest priority)
      const specialRate = await prisma.specialRate.findFirst({
        where: {
          roomTypeId,
          date: {
            equals: new Date(dateString),
          },
        },
      });

      let rate = Number(roomType.basePrice);
      let rateType: 'BASE' | 'SEASONAL' | 'SPECIAL' = 'BASE';
      let rateName = 'Base Rate';

      if (specialRate) {
        rate = Number(specialRate.price);
        rateType = 'SPECIAL';
        rateName = specialRate.reason || 'Special Rate';
      } else {
        // 2. Check Seasonal Rates (Medium priority)
        const seasonalRate = await prisma.seasonalRate.findFirst({
          where: {
            roomTypeId,
            startDate: { lte: currentNightDate },
            endDate: { gte: currentNightDate },
          },
        });

        if (seasonalRate) {
          rateType = 'SEASONAL';
          rateName = seasonalRate.seasonName;
          rate = this.isWeekend(currentNightDate)
            ? Number(seasonalRate.weekendPrice)
            : Number(seasonalRate.weekdayPrice);
        }
      }

      // 3. Extra Bed Charges (default 1500 INR per night)
      const extraBedCharge = extraBeds > 0 ? extraBeds * 1500 : 0;

      // 4. Child Charges
      // Policy: Children 0-5 are free, 6-12 are 750 INR per night, >12 are not allowed as children
      let childCharge = 0;
      if (children > 0 && childrenAges.length > 0) {
        childrenAges.forEach((age) => {
          if (age >= 6 && age <= 12) {
            childCharge += 750;
          } else if (age > 12) {
            childCharge += 1200; // Treated as extra adult charge
          }
        });
      }

      const daySubTotal = rate + extraBedCharge + childCharge;

      totalBaseAmount += rate;
      totalExtraBedAmount += extraBedCharge;
      totalChildAmount += childCharge;

      daysBreakdown.push({
        date: dateString,
        baseRate: rate,
        extraBedCharge,
        childCharge,
        subTotal: daySubTotal,
        rateType,
        rateName,
      });
    }

    const subTotal = totalBaseAmount + totalExtraBedAmount + totalChildAmount;

    // 5. Apply Offers & Discounts
    let discountAmount = 0;
    if (offerId) {
      const offer = await prisma.offer.findUnique({
        where: { id: offerId, status: 'ACTIVE' },
      });

      if (offer) {
        // Check date validity
        const now = new Date();
        if (now >= offer.startDate && now <= offer.endDate) {
          if (offer.discountType === 'PERCENTAGE') {
            discountAmount = (subTotal * Number(offer.discountValue)) / 100;
          } else {
            discountAmount = Number(offer.discountValue);
          }
          // Cap discount at subtotal
          if (discountAmount > subTotal) {
            discountAmount = subTotal;
          }
        }
      }
    }

    const taxableAmount = subTotal - discountAmount;
    
    // 6. Tax calculation (18% standard GST for luxury eco-resorts)
    const taxAmount = Math.round(taxableAmount * 0.18 * 100) / 100;
    const grandTotal = taxableAmount + taxAmount;

    return {
      roomTypeId,
      checkIn,
      checkOut,
      nights,
      daysBreakdown,
      totalBaseAmount,
      totalExtraBedAmount,
      totalChildAmount,
      subTotal,
      discountAmount,
      taxAmount,
      grandTotal,
    };
  }
}
