const axios = require('axios');

class CreditBureauService {
  constructor() {
    this.baseURL = process.env.CREDIT_BUREAU_BASE_URL || 'http://localhost:5000/api/mock/credit-bureau';
  }
  
  async getCreditScore(panCard) {
    try {
      const response = await axios.get(`${this.baseURL}/score/${panCard}`);
      return response.data;
    } catch (error) {
      console.error('Credit Bureau Service error:', error.message);
      return { success: false, message: 'Credit score lookup failed' };
    }
  }
  
  async performCreditCheck(customerId, panCard) {
    try {
      const creditData = await this.getCreditScore(panCard);
      
      if (creditData.success) {
        const { creditScore, creditGrade } = creditData.data;
        
        // Determine eligibility based on credit score
        let eligibility = 'REJECTED';
        let maxLoanAmount = 0;
        let interestRate = 15.0;
        
        if (creditScore >= 750) {
          eligibility = 'APPROVED';
          maxLoanAmount = 1000000;
          interestRate = 10.5;
        } else if (creditScore >= 650) {
          eligibility = 'CONDITIONAL';
          maxLoanAmount = 500000;
          interestRate = 12.0;
        } else if (creditScore >= 550) {
          eligibility = 'REVIEW_REQUIRED';
          maxLoanAmount = 200000;
          interestRate = 14.0;
        }
        
        return {
          success: true,
          data: {
            eligibility,
            creditScore,
            creditGrade,
            maxLoanAmount,
            recommendedInterestRate: interestRate,
            riskAssessment: creditScore >= 750 ? 'LOW' : creditScore >= 650 ? 'MEDIUM' : 'HIGH'
          }
        };
      }
      
      return creditData;
    } catch (error) {
      console.error('Credit check error:', error.message);
      return { success: false, message: 'Credit check failed' };
    }
  }
}

module.exports = CreditBureauService;