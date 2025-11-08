const axios = require('axios');

class OfferService {
  constructor() {
    this.baseURL = process.env.OFFER_BASE_URL || 'http://localhost:5000/api/mock/offers';
  }
  
  async getPreApprovedOffers(customerId) {
    try {
      const response = await axios.get(`${this.baseURL}/pre-approved/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Offer Service error:', error.message);
      return { success: false, message: 'Offer lookup failed' };
    }
  }
  
  async calculateEMI(principal, interestRate, tenure) {
    try {
      const response = await axios.post(`${this.baseURL.replace('/offers', '')}/calculator/emi`, {
        principal,
        interestRate,
        tenure
      });
      return response.data;
    } catch (error) {
      console.error('EMI calculation error:', error.message);
      return { success: false, message: 'EMI calculation failed' };
    }
  }
  
  async generatePersonalizedOffer(customerData, creditData, loanAmount, tenure) {
    try {
      // Get pre-approved offers first
      const offersResponse = await this.getPreApprovedOffers(customerData.id);
      
      if (!offersResponse.success || !offersResponse.data.length) {
        return {
          success: false,
          message: 'No offers available for this customer'
        };
      }
      
      // Find the best matching offer
      const personalLoanOffers = offersResponse.data.filter(offer => 
        offer.productType === 'PERSONAL_LOAN'
      );
      
      if (!personalLoanOffers.length) {
        return {
          success: false,
          message: 'No personal loan offers available'
        };
      }
      
      const bestOffer = personalLoanOffers[0];
      
      // Adjust terms based on requested amount and credit profile
      let finalInterestRate = bestOffer.interestRate;
      let maxAmount = Math.min(loanAmount, bestOffer.maxAmount);
      
      if (creditData.creditScore >= 800) {
        finalInterestRate = Math.max(bestOffer.interestRate - 0.5, 9.5);
      } else if (creditData.creditScore < 700) {
        finalInterestRate = bestOffer.interestRate + 1.0;
      }
      
      // Calculate EMI
      const emiResponse = await this.calculateEMI(maxAmount, finalInterestRate, tenure);
      
      if (!emiResponse.success) {
        throw new Error('EMI calculation failed');
      }
      
      return {
        success: true,
        data: {
          offerId: `CUSTOM_${Date.now()}`,
          productType: 'PERSONAL_LOAN',
          approvedAmount: maxAmount,
          interestRate: finalInterestRate,
          tenure: tenure,
          monthlyEmi: emiResponse.data.emi,
          processingFee: bestOffer.processingFee,
          totalAmount: emiResponse.data.totalAmount,
          totalInterest: emiResponse.data.totalInterest,
          features: bestOffer.features,
          validUntil: new Date(Date.now() + 7*24*60*60*1000).toISOString(), // 7 days validity
          terms: {
            disbursementTime: '24-48 hours',
            prepaymentCharges: 'NIL after 12 months',
            latePaymentCharges: '2% per month',
            documentation: 'Minimal documentation required'
          }
        }
      };
    } catch (error) {
      console.error('Personalized offer generation error:', error.message);
      return { success: false, message: 'Failed to generate personalized offer' };
    }
  }
}

module.exports = OfferService;