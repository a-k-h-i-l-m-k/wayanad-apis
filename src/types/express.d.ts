export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: {
          id: string;
          name: string;
          permissions: string[]; // Array of permission names
        };
      };
    }
  }
}
