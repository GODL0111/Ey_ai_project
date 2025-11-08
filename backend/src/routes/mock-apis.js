const express = require('express');
const router = express.Router();

// Mock CRM API - provides customer information and KYC verification
router.get('/crm/customer/:phone', (req, res) => {
  const { phone } = req.params;
  
  // Mock customer database
  const customers = {
    '9876543210': {
      id: 'CUST001',
      name: 'Raj Sharma',
      phone: '9876543210',
      email: 'raj.sharma@email.com',
      address: '123 Laxmi Nagar, Delhi, 110092',
      panCard: 'ABCDE1234F',
      aadharCard: '1234-5678-9012',
      dateOfBirth: '1985-03-15',
      accountNumber: '123456789012',
      ifscCode: 'HDFC0001234',
      kycStatus: 'VERIFIED',
      riskProfile: 'LOW',
      employmentType: 'SALARIED',
      monthlyIncome: 85000,
      companyName: 'Tech Solutions Pvt Ltd'
    },
    '9876543211': {
      id: 'CUST002',
      name: 'Priya Patel',
      phone: '9876543211',
      email: 'priya.patel@email.com',
      address: '456 MG Road, Bangalore, 560001',
      panCard: 'FGHIJ5678K',
      aadharCard: '5678-9012-3456',
      dateOfBirth: '1990-07-22',
      accountNumber: '987654321098',
      ifscCode: 'ICICI0005678',
      kycStatus: 'PENDING',
      riskProfile: 'MEDIUM',
      employmentType: 'SELF_EMPLOYED',
      monthlyIncome: 120000,
      companyName: 'Patel Enterprises'
    }
  };
  
  const customer = customers[phone];
  
  if (customer) {
    res.json({
      success: true,
      data: customer
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }
});

// Verify customer identity
router.post('/crm/verify-identity', (req, res) => {
  const { customerId, name, dateOfBirth } = req.body;
  
  // Simple mock verification
  const isVerified = name && dateOfBirth && customerId;
  
  res.json({
    success: true,
    data: {
      verified: isVerified,
      verificationScore: isVerified ? 95 : 15,
      riskFlags: isVerified ? [] : ['IDENTITY_MISMATCH']
    }
  });
});

// Mock Credit Bureau API - provides credit scores and history
router.get('/credit-bureau/score/:panCard', (req, res) => {
  const { panCard } = req.params;
  
  // Mock credit scores
  const creditData = {
    'ABCDE1234F': {
      creditScore: 820,
      creditGrade: 'EXCELLENT',
      creditHistory: {
        totalAccounts: 8,
        activeAccounts: 5,
        closedAccounts: 3,
        totalCreditLimit: 1500000,
        totalOutstanding: 85000,
        creditUtilization: 5.67,
        paymentHistory: 'EXCELLENT',
        lengthOfCreditHistory: '8 years 3 months'
      },
      recentInquiries: 2,
      defaultHistory: [],
      bankruptcyHistory: [],
      lastUpdated: new Date().toISOString()
    },
    'FGHIJ5678K': {
      creditScore: 750,
      creditGrade: 'GOOD',
      creditHistory: {
        totalAccounts: 6,
        activeAccounts: 4,
        closedAccounts: 2,
        totalCreditLimit: 800000,
        totalOutstanding: 120000,
        creditUtilization: 15.0,
        paymentHistory: 'GOOD',
        lengthOfCreditHistory: '5 years 8 months'
      },
      recentInquiries: 1,
      defaultHistory: [],
      bankruptcyHistory: [],
      lastUpdated: new Date().toISOString()
    }
  };
  
  const data = creditData[panCard];
  
  if (data) {
    res.json({
      success: true,
      data
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Credit data not found'
    });
  }
});

// Mock Offer API - provides pre-approved loan offers
router.get('/offers/pre-approved/:customerId', (req, res) => {
  const { customerId } = req.params;
  
  // Mock pre-approved offers
  const offers = {
    'CUST001': [
      {
        offerId: 'OFFER001',
        productType: 'PERSONAL_LOAN',
        maxAmount: 800000,
        minAmount: 100000,
        interestRate: 10.5,
        processingFee: 1.0, // percentage
        maxTenure: 60, // months
        minTenure: 12,
        eligibleAmount: 800000,
        monthlyEmi: 16330, // for 50000 at 36 months
        preApprovalStatus: 'APPROVED',
        validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        features: [
          'No guarantor required',
          'Quick disbursement in 24 hours',
          'Flexible repayment options',
          'No hidden charges'
        ]
      },
      {
        offerId: 'OFFER002',
        productType: 'BUSINESS_LOAN',
        maxAmount: 1500000,
        minAmount: 200000,
        interestRate: 11.5,
        processingFee: 1.5,
        maxTenure: 72,
        minTenure: 12,
        eligibleAmount: 1200000,
        monthlyEmi: 18500,
        preApprovalStatus: 'PRE_QUALIFIED',
        validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        features: [
          'Business expansion support',
          'Competitive interest rates',
          'Doorstep service available'
        ]
      }
    ],
    'CUST002': [
      {
        offerId: 'OFFER003',
        productType: 'PERSONAL_LOAN',
        maxAmount: 600000,
        minAmount: 100000,
        interestRate: 12.0,
        processingFee: 1.5,
        maxTenure: 60,
        minTenure: 12,
        eligibleAmount: 500000,
        monthlyEmi: 16000,
        preApprovalStatus: 'CONDITIONAL',
        validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        features: [
          'Special rates for existing customers',
          'Flexible documentation',
          'Quick approval process'
        ]
      }
    ]
  };
  
  const customerOffers = offers[customerId];
  
  if (customerOffers) {
    res.json({
      success: true,
      data: customerOffers
    });
  } else {
    res.json({
      success: true,
      data: [],
      message: 'No pre-approved offers available'
    });
  }
});

// Calculate EMI
router.post('/calculator/emi', (req, res) => {
  const { principal, interestRate, tenure } = req.body;
  
  if (!principal || !interestRate || !tenure) {
    return res.status(400).json({
      success: false,
      message: 'Principal, interest rate, and tenure are required'
    });
  }
  
  // EMI = [P x R x (1+R)^N] / [(1+R)^N-1]
  const P = parseFloat(principal);
  const R = parseFloat(interestRate) / 12 / 100; // Monthly interest rate
  const N = parseInt(tenure);
  
  const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
  const totalAmount = emi * N;
  const totalInterest = totalAmount - P;
  
  res.json({
    success: true,
    data: {
      emi: Math.round(emi),
      totalAmount: Math.round(totalAmount),
      totalInterest: Math.round(totalInterest),
      principal: P,
      interestRate: parseFloat(interestRate),
      tenure: N
    }
  });
});

module.exports = router;