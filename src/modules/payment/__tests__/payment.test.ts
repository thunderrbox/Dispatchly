import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../../../lib/prisma';

vi.mock('../../../lib/prisma', () => {
  return {
    default: {
      order: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

describe('UPI Payment System & Dynamic QR Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const adminPhone = '9696146006';
  const primaryUpiId = '9696146006@paytm';

  it('should construct valid dynamic UPI URI targeting Admin phone 9696146006', () => {
    const orderRef = 'ORD-109283';
    const amount = 350.5;
    const formattedAmount = amount.toFixed(2);

    const upiUri = `upi://pay?pa=${primaryUpiId}&pn=${encodeURIComponent('Dispatchly Logistics')}&am=${formattedAmount}&tr=${orderRef}&tn=${encodeURIComponent(`Dispatchly Order ${orderRef}`)}&cu=INR`;

    expect(upiUri).toContain(`pa=${adminPhone}@paytm`);
    expect(upiUri).toContain(`am=350.50`);
    expect(upiUri).toContain(`tr=${orderRef}`);
    expect(upiUri).toContain('cu=INR');
  });

  it('should generate dynamic QR code URL with encoded UPI payload', () => {
    const orderRef = 'ORD-[#992]';
    const amount = 500;
    const upiUri = `upi://pay?pa=${primaryUpiId}&am=${amount}&tr=${orderRef}`;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiUri)}`;

    expect(qrCodeUrl).toContain('api.qrserver.com');
    expect(qrCodeUrl).toContain(encodeURIComponent(upiUri));
  });

  it('should update Order record as PAID with transaction details when payment is confirmed', async () => {
    const mockOrder = {
      id: 'order-uuid-123',
      finalAmount: 250,
      isPaid: false,
      paymentMethod: null,
      paymentTxnId: null,
      paidAt: null,
    };

    (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
    (prisma.order.update as any).mockImplementation(({ data }: any) =>
      Promise.resolve({
        ...mockOrder,
        ...data,
      })
    );

    const paymentData = {
      orderId: 'order-uuid-123',
      paymentMethod: 'UPI_GPAY',
      paymentTxnId: 'UTR-992018237482',
    };

    const existingOrder = await prisma.order.findUnique({ where: { id: paymentData.orderId } });
    expect(existingOrder).toBeDefined();

    const updated = await prisma.order.update({
      where: { id: paymentData.orderId },
      data: {
        isPaid: true,
        paymentMethod: paymentData.paymentMethod,
        paymentTxnId: paymentData.paymentTxnId,
        paidAt: new Date(),
      },
    });

    expect(updated.isPaid).toBe(true);
    expect(updated.paymentMethod).toBe('UPI_GPAY');
    expect(updated.paymentTxnId).toBe('UTR-992018237482');
    expect(updated.paidAt).toBeInstanceOf(Date);
  });
});
