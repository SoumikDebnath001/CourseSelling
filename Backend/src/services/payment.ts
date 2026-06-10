/**
 * Payment seam.
 *
 * Today every enrollment is free, but enrollment logic talks ONLY to this interface
 * so a real gateway can be dropped in later (Razorpay/Stripe) by adding a new
 * provider and swapping the export — with no changes to controllers or the frontend.
 */
export interface PaymentIntent {
  paid: boolean;
  reference: string;
  amount: number;
}

export interface PaymentProvider {
  /** Charge for a course. Returns a settled intent (free provider settles instantly). */
  charge(args: { userId: string; courseId: string; amount: number }): Promise<PaymentIntent>;
}

class FreeProvider implements PaymentProvider {
  async charge({ amount }: { userId: string; courseId: string; amount: number }): Promise<PaymentIntent> {
    return { paid: true, reference: "free", amount: amount > 0 ? 0 : amount };
  }
}

export const paymentProvider: PaymentProvider = new FreeProvider();
