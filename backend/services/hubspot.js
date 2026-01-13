const axios = require('axios');

const HUBSPOT_API_URL = 'https://api.hubapi.com';

class HubSpotService {
  constructor() {
    this.accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
    this.enabled = process.env.ENABLE_HUBSPOT_INTEGRATION === 'true' && !!this.accessToken;
    
    // Bind methods to preserve 'this' context
    this.createOrUpdateContact = this.createOrUpdateContact.bind(this);
    this.createContactBasicOnly = this.createContactBasicOnly.bind(this);
    this.updateExistingContact = this.updateExistingContact.bind(this);
    this.updateContactBasicOnly = this.updateContactBasicOnly.bind(this);
    this.addNote = this.addNote.bind(this);
    this.updateLeadStatus = this.updateLeadStatus.bind(this);
  }

  async createOrUpdateContact(userData) {
    if (!this.enabled) {
      console.log('⚠️  HubSpot integration disabled');
      return null;
    }

    try {
      // Build properties object with guaranteed fields
      const properties = {
        email: userData.email,
      };

      // Add optional fields only if provided
      if (userData.firstName) properties.firstname = userData.firstName;
      if (userData.lastName) properties.lastname = userData.lastName;
      if (userData.phoneNumber) properties.phone = userData.phoneNumber;
      if (userData.country) properties.country = userData.country;

      // Add custom AEO fields
      properties.lead_source = 'AEO Audit Suite';
      properties.aeo_lead_status = 'New Lead';

      // LOG what we're sending
      console.log('📤 Sending to HubSpot:');
      console.log('   Email:', properties.email);
      console.log('   Lead Source:', properties.lead_source);
      console.log('   AEO Lead Status:', properties.aeo_lead_status);
      console.log('   Full properties:', JSON.stringify(properties, null, 2));

      const response = await axios.post(
        `${HUBSPOT_API_URL}/crm/v3/objects/contacts`,
        { properties },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✓ HubSpot contact created:', userData.email);
      console.log('   Contact ID:', response.data.id);
      
      // LOG what HubSpot returned
      if (response.data.properties) {
        console.log('📥 HubSpot returned properties:');
        console.log('   lead_source:', response.data.properties.lead_source || 'NOT SET');
        console.log('   aeo_lead_status:', response.data.properties.aeo_lead_status || 'NOT SET');
      }

      return response.data.id;

    } catch (error) {
      // If contact already exists, update it
      if (error.response?.status === 409) {
        console.log('ℹ️  Contact exists, updating...');
        return await this.updateExistingContact(userData);
      }

      // Log detailed error info
      console.error('✗ HubSpot API Error:', error.response?.data?.message || error.message);
      
      if (error.response?.data?.message?.includes('does not exist')) {
        console.log('⚠️  Property error - checking which fields failed...');
        
        // Try to parse which properties failed
        if (error.response?.data?.correlationId) {
          console.log('   Correlation ID:', error.response.data.correlationId);
        }
        
        if (error.response?.data?.validationResults) {
          console.log('   Validation errors:', JSON.stringify(error.response.data.validationResults, null, 2));
        }
        
        console.log('   Retrying with basic fields only...');
        return await this.createContactBasicOnly(userData);
      }

      return null;
    }
  }

  async createContactBasicOnly(userData) {
    try {
      // Only use guaranteed-to-exist properties (no custom fields)
      const properties = {
        email: userData.email,
      };

      if (userData.firstName) properties.firstname = userData.firstName;
      if (userData.lastName) properties.lastname = userData.lastName;
      if (userData.phoneNumber) properties.phone = userData.phoneNumber;
      if (userData.country) properties.country = userData.country;

      console.log('📤 Sending to HubSpot (basic fields only):', JSON.stringify(properties, null, 2));

      const response = await axios.post(
        `${HUBSPOT_API_URL}/crm/v3/objects/contacts`,
        { properties },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✓ HubSpot contact created (basic fields only):', userData.email);
      return response.data.id;

    } catch (error) {
      console.error('✗ HubSpot API Error (basic):', error.response?.data?.message || error.message);
      return null;
    }
  }

  async updateExistingContact(userData) {
    try {
      // Search for contact by email
      const searchResponse = await axios.post(
        `${HUBSPOT_API_URL}/crm/v3/objects/contacts/search`,
        {
          filterGroups: [{
            filters: [{
              propertyName: 'email',
              operator: 'EQ',
              value: userData.email
            }]
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (searchResponse.data.results.length === 0) {
        console.log('✗ Contact not found for update');
        return null;
      }

      const contactId = searchResponse.data.results[0].id;
      console.log('ℹ️  Found existing contact:', contactId);

      // Update with all available properties
      const properties = {};
      if (userData.firstName) properties.firstname = userData.firstName;
      if (userData.lastName) properties.lastname = userData.lastName;
      if (userData.phoneNumber) properties.phone = userData.phoneNumber;
      if (userData.country) properties.country = userData.country;
      
      // Try to update custom fields
      properties.lead_source = 'AEO Audit Suite';
      properties.aeo_lead_status = 'Verified';

      console.log('📤 Updating HubSpot contact:');
      console.log('   Lead Source:', properties.lead_source);
      console.log('   AEO Lead Status:', properties.aeo_lead_status);

      await axios.patch(
        `${HUBSPOT_API_URL}/crm/v3/objects/contacts/${contactId}`,
        { properties },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✓ HubSpot contact updated:', userData.email);
      return contactId;

    } catch (error) {
      // If custom fields don't exist, update with basic fields only
      if (error.response?.data?.message?.includes('does not exist')) {
        console.log('⚠️  Custom fields error on update, trying basic fields...');
        
        // Log which properties failed
        if (error.response?.data?.validationResults) {
          console.log('   Failed properties:', JSON.stringify(error.response.data.validationResults, null, 2));
        }
        
        return await this.updateContactBasicOnly(userData);
      }
      
      console.error('✗ HubSpot update error:', error.response?.data?.message || error.message);
      return null;
    }
  }

  async updateContactBasicOnly(userData) {
    try {
      const searchResponse = await axios.post(
        `${HUBSPOT_API_URL}/crm/v3/objects/contacts/search`,
        {
          filterGroups: [{
            filters: [{
              propertyName: 'email',
              operator: 'EQ',
              value: userData.email
            }]
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (searchResponse.data.results.length === 0) return null;

      const contactId = searchResponse.data.results[0].id;
      const properties = {};
      
      if (userData.firstName) properties.firstname = userData.firstName;
      if (userData.lastName) properties.lastname = userData.lastName;
      if (userData.phoneNumber) properties.phone = userData.phoneNumber;
      if (userData.country) properties.country = userData.country;

      await axios.patch(
        `${HUBSPOT_API_URL}/crm/v3/objects/contacts/${contactId}`,
        { properties },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✓ HubSpot contact updated (basic fields):', userData.email);
      return contactId;

    } catch (error) {
      console.error('✗ HubSpot update error (basic):', error.response?.data?.message || error.message);
      return null;
    }
  }

  async addNote(contactId, noteText) {
    if (!this.enabled || !contactId) return null;

    try {
      const response = await axios.post(
        `${HUBSPOT_API_URL}/crm/v3/objects/notes`,
        {
          properties: {
            hs_note_body: noteText,
            hs_timestamp: new Date().toISOString()
          },
          associations: [{
            to: { id: contactId },
            types: [{
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 202
            }]
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✓ Note added to HubSpot contact ${contactId}`);
      return response.data.id;

    } catch (error) {
      console.error('✗ HubSpot note error:', error.response?.data?.message || error.message);
      return null;
    }
  }

  async updateLeadStatus(contactId, status) {
    if (!this.enabled || !contactId) return null;

    try {
      await axios.patch(
        `${HUBSPOT_API_URL}/crm/v3/objects/contacts/${contactId}`,
        {
          properties: {
            aeo_lead_status: status
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✓ HubSpot lead status updated to: ${status}`);
      return true;

    } catch (error) {
      console.error('✗ HubSpot status update error:', error.response?.data?.message || error.message);
      return false;
    }
  }
}

// Export a singleton instance
module.exports = new HubSpotService();
