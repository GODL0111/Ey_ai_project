const axios = require('axios');

class CRMService {
  constructor() {
    this.baseURL = process.env.CRM_BASE_URL || 'http://localhost:5000/api/mock/crm';
  }
  
  async getCustomerByPhone(phone) {
    try {
      const response = await axios.get(`${this.baseURL}/customer/${phone}`);
      return response.data;
    } catch (error) {
      console.error('CRM Service error:', error.message);
      return { success: false, message: 'Customer lookup failed' };
    }
  }
  
  async verifyIdentity(customerId, name, dateOfBirth) {
    try {
      const response = await axios.post(`${this.baseURL}/verify-identity`, {
        customerId,
        name,
        dateOfBirth
      });
      return response.data;
    } catch (error) {
      console.error('Identity verification error:', error.message);
      return { success: false, message: 'Identity verification failed' };
    }
  }
}

module.exports = CRMService;