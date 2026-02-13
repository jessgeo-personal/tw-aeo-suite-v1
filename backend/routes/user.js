const express = require('express');
const router = express.Router();
const { extractUser } = require('../middleware/auth');
const { createOrUpdateContact } = require('../utils/hubspot');

/**
 * PATCH /api/user/profile
 * Update user profile information
 */
router.patch('/profile', extractUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }

    const { company, firstName, lastName, phone, country } = req.body;
    
    // Update allowed fields
    if (company !== undefined) req.user.company = company;
    if (firstName !== undefined) req.user.firstName = firstName;
    if (lastName !== undefined) req.user.lastName = lastName;
    if (phone !== undefined) req.user.phone = phone;
    if (country !== undefined) req.user.country = country;

    await req.user.save();

    // Sync with HubSpot
    try {
      await createOrUpdateContact({
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        company: req.user.company,
        phone: req.user.phone,
        country: req.user.country,
        leadInterest: 'Profile Update'
      });
    } catch (hubspotError) {
      console.error('HubSpot sync error:', hubspotError);
      // Don't fail the request if HubSpot fails
    }

    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: {
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        company: req.user.company,
        phone: req.user.phone,
        country: req.user.country
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
});

module.exports = router;
