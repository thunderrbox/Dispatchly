import { describe, it, expect } from 'vitest';
import { calculateRateSync } from '../rate.service';

describe('Rate Calculation Engine', () => {
  const mockActiveRateCard = {
    pricePerKg: 10,
    codCharge: 15,
    isActive: true,
  };

  // Case 1: Actual weight > volumetric weight -> uses actual
  it('should use actual weight if it is greater than volumetric weight', () => {
    const result = calculateRateSync({
      actualWeight: 10, // 10 kg
      lengthCm: 20,
      widthCm: 20,
      heightCm: 20, // Volumetric = (20*20*20)/5000 = 1.6 kg
      orderType: 'B2C',
      paymentType: 'PREPAID',
      zoneType: 'INTRA_ZONE',
      rateCard: mockActiveRateCard,
    });

    expect(result.volumetricWeight).toBe(1.6);
    expect(result.billableWeight).toBe(10);
    expect(result.baseAmount).toBe(100); // 10 * 10
    expect(result.codSurcharge).toBe(0);
    expect(result.finalAmount).toBe(100);
  });

  // Case 2: Volumetric weight > actual weight -> uses volumetric
  it('should use volumetric weight if it is greater than actual weight', () => {
    const result = calculateRateSync({
      actualWeight: 2, // 2 kg
      lengthCm: 30,
      widthCm: 30,
      heightCm: 30, // Volumetric = (30*30*30)/5000 = 5.4 kg
      orderType: 'B2C',
      paymentType: 'PREPAID',
      zoneType: 'INTRA_ZONE',
      rateCard: mockActiveRateCard,
    });

    expect(result.volumetricWeight).toBe(5.4);
    expect(result.billableWeight).toBe(5.4);
    expect(result.baseAmount).toBe(54); // 5.4 * 10
    expect(result.codSurcharge).toBe(0);
    expect(result.finalAmount).toBe(54);
  });

  // Case 3: Actual == volumetric (boundary)
  it('should handle boundary case where actual and volumetric weight are equal', () => {
    const result = calculateRateSync({
      actualWeight: 8, // 8 kg
      lengthCm: 40,
      widthCm: 40,
      heightCm: 25, // Volumetric = (40*40*25)/5000 = 40000/5000 = 8 kg
      orderType: 'B2B',
      paymentType: 'PREPAID',
      zoneType: 'INTRA_ZONE',
      rateCard: mockActiveRateCard,
    });

    expect(result.volumetricWeight).toBe(8);
    expect(result.billableWeight).toBe(8);
    expect(result.baseAmount).toBe(80); // 8 * 10
    expect(result.finalAmount).toBe(80);
  });

  // Case 4: COD payment -> adds flat codCharge
  it('should add codCharge to the final amount if payment type is COD', () => {
    const result = calculateRateSync({
      actualWeight: 5,
      lengthCm: 10,
      widthCm: 10,
      heightCm: 10, // Volumetric = 0.2
      orderType: 'B2C',
      paymentType: 'COD',
      zoneType: 'INTER_ZONE',
      rateCard: mockActiveRateCard,
    });

    expect(result.billableWeight).toBe(5);
    expect(result.baseAmount).toBe(50); // 5 * 10
    expect(result.codSurcharge).toBe(15); // flat fee from rate card
    expect(result.finalAmount).toBe(65); // 50 + 15
  });

  // Case 5: Prepaid payment -> no codCharge
  it('should not add codCharge if payment type is PREPAID', () => {
    const result = calculateRateSync({
      actualWeight: 5,
      lengthCm: 10,
      widthCm: 10,
      heightCm: 10,
      orderType: 'B2C',
      paymentType: 'PREPAID',
      zoneType: 'INTER_ZONE',
      rateCard: mockActiveRateCard,
    });

    expect(result.codSurcharge).toBe(0);
    expect(result.finalAmount).toBe(50);
  });

  // Case 6: Reject zero or negative dimensions
  it('should throw an error if weight or dimensions are zero or negative', () => {
    expect(() =>
      calculateRateSync({
        actualWeight: -1,
        lengthCm: 10,
        widthCm: 10,
        heightCm: 10,
        orderType: 'B2C',
        paymentType: 'PREPAID',
        zoneType: 'INTRA_ZONE',
        rateCard: mockActiveRateCard,
      })
    ).toThrow('Weight and dimensions must be greater than zero');

    expect(() =>
      calculateRateSync({
        actualWeight: 5,
        lengthCm: 0,
        widthCm: 10,
        heightCm: 10,
        orderType: 'B2C',
        paymentType: 'PREPAID',
        zoneType: 'INTRA_ZONE',
        rateCard: mockActiveRateCard,
      })
    ).toThrow('Weight and dimensions must be greater than zero');
  });

  // Case 7: Inactive rate card throws error
  it('should throw an error if the rate card is inactive', () => {
    const inactiveRateCard = {
      pricePerKg: 10,
      codCharge: 15,
      isActive: false,
    };

    expect(() =>
      calculateRateSync({
        actualWeight: 5,
        lengthCm: 10,
        widthCm: 10,
        heightCm: 10,
        orderType: 'B2C',
        paymentType: 'PREPAID',
        zoneType: 'INTRA_ZONE',
        rateCard: inactiveRateCard,
      })
    ).toThrow('Rate card is inactive');
  });
});
