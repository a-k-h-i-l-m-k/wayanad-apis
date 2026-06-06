import { prisma } from '../configs/prisma';
import { BadRequestError } from '../utils/errors';

export interface SearchAvailabilityRequest {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children: number;
}

export interface AvailableRoomTypeResult {
  roomTypeId: string;
  name: string;
  slug: string;
  basePrice: number;
  maxOccupancy: number;
  sizeSqft: number;
  viewType: string;
  extraBedAllowed: boolean;
  totalRooms: number;
  bookedCount: number;
  availableCount: number;
  isAvailable: boolean;
}

export class AvailabilityService {
  /**
   * Search available room types and their remaining counts for given dates and capacity requirements.
   */
  public async searchAvailability(params: SearchAvailabilityRequest): Promise<AvailableRoomTypeResult[]> {
    const { checkIn, checkOut, adults, children } = params;

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError('Invalid date formats. Please use YYYY-MM-DD.');
    }

    if (start >= end) {
      throw new BadRequestError('Check-out date must be after check-in date.');
    }

    // 1. Get all room types
    const roomTypes = await prisma.roomType.findMany({
      where: { status: 'ACTIVE' },
      include: {
        rooms: {
          where: {
            maintenanceStatus: 'OPERATIONAL',
          },
        },
      },
    });

    // 2. Get all booking rooms that overlap with requested dates and are not cancelled
    const overlappingBookingRooms = await prisma.bookingRoom.findMany({
      where: {
        booking: {
          bookingStatus: { not: 'CANCELLED' },
          checkIn: { lt: end },
          checkOut: { gt: start },
        },
      },
      select: {
        roomId: true,
        roomTypeId: true,
      },
    });

    // Map booked rooms to their room types for quick lookup
    const bookedRoomsByRoomType: Record<string, number> = {};
    overlappingBookingRooms.forEach((br: any) => {
      bookedRoomsByRoomType[br.roomTypeId] = (bookedRoomsByRoomType[br.roomTypeId] || 0) + 1;
    });

    // 3. Format and filter results
    const results: AvailableRoomTypeResult[] = roomTypes.map((rt: any) => {
      const totalRooms = rt.rooms.length; // Only counting OPERATIONAL rooms
      const bookedCount = bookedRoomsByRoomType[rt.id] || 0;
      const availableCount = Math.max(0, totalRooms - bookedCount);
      
      // Check if capacity fits
      const fitsCapacity = (adults <= rt.maxAdults) && 
                            (children <= rt.maxChildren) && 
                            (adults + children <= rt.maxOccupancy);

      return {
        roomTypeId: rt.id,
        name: rt.name,
        slug: rt.slug,
        basePrice: Number(rt.basePrice),
        maxOccupancy: rt.maxOccupancy,
        sizeSqft: rt.sizeSqft,
        viewType: rt.viewType,
        extraBedAllowed: rt.extraBedAllowed,
        totalRooms,
        bookedCount,
        availableCount,
        isAvailable: availableCount > 0 && fitsCapacity,
      };
    });

    return results;
  }

  /**
   * Check room availability for a specific room type and suggest physical Room records that can be allocated
   */
  public async getAvailableRoomsForAllocation(
    roomTypeId: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<any[]> {
    // Get all rooms of this type that are operational
    const allRooms = await prisma.room.findMany({
      where: {
        roomTypeId,
        maintenanceStatus: 'OPERATIONAL',
      },
    });

    // Find rooms already allocated to bookings overlapping the dates
    const allocatedBookingRooms = await prisma.bookingRoom.findMany({
      where: {
        roomTypeId,
        roomId: { not: null },
        booking: {
          bookingStatus: { not: 'CANCELLED' },
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
        },
      },
      select: {
        roomId: true,
      },
    });

    const allocatedRoomIds = new Set(allocatedBookingRooms.map((abr: any) => abr.roomId));

    // Return the rooms that are not allocated
    return allRooms.filter((room: any) => !allocatedRoomIds.has(room.id));
  }

  /**
   * Check if a list of requested rooms are all available for a date range
   */
  public async checkSpecificRoomsAvailability(
    roomIds: string[],
    checkIn: string,
    checkOut: string
  ): Promise<boolean> {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const overlappingBookings = await prisma.bookingRoom.count({
      where: {
        roomId: { in: roomIds },
        booking: {
          bookingStatus: { not: 'CANCELLED' },
          checkIn: { lt: end },
          checkOut: { gt: start },
        },
      },
    });

    return overlappingBookings === 0;
  }
}
