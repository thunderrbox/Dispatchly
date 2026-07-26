import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { paymentMethod = 'UPI_QR', paymentTxnId } = body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        paymentMethod,
        paymentTxnId: paymentTxnId || `TXN-${Date.now()}`,
        paidAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed successfully',
      order: updatedOrder,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process payment' },
      { status: 500 }
    );
  }
}
