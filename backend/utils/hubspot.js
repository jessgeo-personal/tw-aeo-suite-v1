const axios = require('axios');

const HUBSPOT_API_URL = 'https://api.hubapi.com';

/**
 * Create or update a HubSpot contact with lead information
 * @param {Object} contactData - Contact information
 * @param {string} contactData.email - Contact email (required)
 * @param {string} contactData.firstName - First name
 * @param {string} contactData.lastName - Last name
 * @param {string} contactData.company - Company name
 * @param {string} contactData.phone - Phone number
 * @param {string} contactData.country - Country
 * @param {string} contactData.leadInterest - Lead interest value
 * @returns {Promise<Object>} HubSpot contact response
 */
async function createOrUpdateContact(contactData) {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ HubSpot access token not configured');
    throw new Error('HubSpot integration not configured');
  }

  if (!process.env.ENABLE_HUBSPOT_INTEGRATION || process.env.ENABLE_HUBSPOT_INTEGRATION === 'false') {
    console.log('⚠️ HubSpot integration is disabled');
    return { success: false, message: 'HubSpot integration disabled' };
  }

  try {
    const { email, firstName, lastName, company, phone, country, leadInterest } = contactData;

    // Prepare properties for HubSpot
    const properties = {
      email,
      firstname: firstName || '',
      lastname: lastName || '',
      company: company || '',
      phone: phone || '',
      country: country || '',
      lead_interest: leadInterest || '', // Custom HubSpot field
      lead_source: 'AEO Audit Tool',
      aeo_lead_status: 'New Lead' // Must be one of: Verified, New Lead, Converted, Active User
    };

    // Remove empty values to avoid overwriting existing data with blanks
    Object.keys(properties).forEach(key => {
      if (!properties[key]) {
        delete properties[key];
      }
    });

    console.log(`📤 Sending contact to HubSpot: ${email}`);

    // Try to create or update contact
    // HubSpot will automatically update if email exists, create if new
    const response = await axios.post(
      `${HUBSPOT_API_URL}/crm/v3/objects/contacts`,
      { properties },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ HubSpot contact created/updated: ${response.data.id}`);

    return {
      success: true,
      contactId: response.data.id,
      message: 'Contact synced with HubSpot'
    };

  } catch (error) {
    // Handle duplicate email (409 conflict) - try to update instead
    if (error.response && error.response.status === 409) {
      console.log(`⚠️ Contact exists, attempting update for: ${contactData.email}`);
      
      try {
        // Search for existing contact by email
        const searchResponse = await axios.post(
          `${HUBSPOT_API_URL}/crm/v3/objects/contacts/search`,
          {
            filterGroups: [{
              filters: [{
                propertyName: 'email',
                operator: 'EQ',
                value: contactData.email
              }]
            }]
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (searchResponse.data.results && searchResponse.data.results.length > 0) {
          const contactId = searchResponse.data.results[0].id;
          
          // Prepare update properties (without email)
          const updateProperties = { ...contactData };
          delete updateProperties.email; // Can't update email
          
          const properties = {
            firstname: updateProperties.firstName || '',
            lastname: updateProperties.lastName || '',
            company: updateProperties.company || '',
            phone: updateProperties.phone || '',
            country: updateProperties.country || '',
            lead_interest: updateProperties.leadInterest || '',
            lead_source: 'AEO Audit Tool',
            aeo_lead_status: 'Active User' // Existing contact, so mark as Active User
          };

          // Remove empty values
          Object.keys(properties).forEach(key => {
            if (!properties[key]) {
              delete properties[key];
            }
          });

          // Update existing contact
          const updateResponse = await axios.patch(
            `${HUBSPOT_API_URL}/crm/v3/objects/contacts/${contactId}`,
            { properties },
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log(`✅ HubSpot contact updated: ${contactId}`);

          return {
            success: true,
            contactId: contactId,
            message: 'Contact updated in HubSpot'
          };
        }
      } catch (updateError) {
        console.error('❌ Error updating HubSpot contact:', updateError.response?.data || updateError.message);
        throw updateError;
      }
    }

    // Log other errors
    console.error('❌ HubSpot API error:', error.response?.data || error.message);
    
    // Return graceful error instead of throwing
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      message: 'Failed to sync with HubSpot'
    };
  }
}

/**
 * Get contact by email from HubSpot
 * @param {string} email - Contact email
 * @returns {Promise<Object>} HubSpot contact or null
 */
async function getContactByEmail(email) {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ HubSpot access token not configured');
    return null;
  }

  try {
    const response = await axios.post(
      `${HUBSPOT_API_URL}/crm/v3/objects/contacts/search`,
      {
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: email
          }]
        }]
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0];
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching HubSpot contact:', error.response?.data || error.message);
    return null;
  }
}

module.exports = {
  createOrUpdateContact,
  getContactByEmail
};