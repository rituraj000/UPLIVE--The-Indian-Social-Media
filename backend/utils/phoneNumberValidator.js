class PhoneNumberValidator {
  // Validate phone number format
  static isValid(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== "string") {
      return false;
    }

    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, "");

    // Must be between 10-15 digits
    if (cleaned.length < 10 || cleaned.length > 15) {
      return false;
    }

    // Check for common invalid patterns
    if (/^0+$/.test(cleaned) || /^1+$/.test(cleaned)) {
      return false;
    }

    return true;
  }

  // Check if number is Indian
  static isIndianNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, "");

    // Indian numbers: +91 followed by 10 digits
    // Valid patterns: 91XXXXXXXXXX (12 digits) or XXXXXXXXXX (10 digits)
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      const mobileNumber = cleaned.substring(2);
      return this.isValidIndianMobile(mobileNumber);
    } else if (cleaned.length === 10) {
      return this.isValidIndianMobile(cleaned);
    }

    return false;
  }

  // Validate Indian mobile number format
  static isValidIndianMobile(number) {
    // Indian mobile numbers start with 6, 7, 8, or 9
    // and are exactly 10 digits long
    return /^[6-9]\d{9}$/.test(number);
  }

  // Format phone number for SMS providers
  static formatForProvider(phoneNumber, provider = "international") {
    const cleaned = phoneNumber.replace(/\D/g, "");

    switch (provider) {
      case "twilio":
      case "aws":
        // International format with +
        if (cleaned.length === 10) {
          return `+91${cleaned}`; // Assume Indian if 10 digits
        } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
          return `+${cleaned}`;
        } else {
          return `+${cleaned}`;
        }

      case "msg91":
        // MSG91 expects without + prefix
        if (cleaned.length === 10) {
          return `91${cleaned}`;
        } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
          return cleaned;
        } else {
          throw new Error("MSG91 only supports Indian phone numbers");
        }

      default:
        // International format
        if (cleaned.length === 10) {
          return `+91${cleaned}`;
        } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
          return `+${cleaned}`;
        } else {
          return `+${cleaned}`;
        }
    }
  }

  // Get country info from phone number
  static getCountryInfo(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, "");

    // Common country codes
    const countryCodes = {
      1: { name: "United States/Canada", code: "US/CA" },
      44: { name: "United Kingdom", code: "UK" },
      91: { name: "India", code: "IN" },
      86: { name: "China", code: "CN" },
      81: { name: "Japan", code: "JP" },
      49: { name: "Germany", code: "DE" },
      33: { name: "France", code: "FR" },
      39: { name: "Italy", code: "IT" },
      34: { name: "Spain", code: "ES" },
      7: { name: "Russia", code: "RU" },
      55: { name: "Brazil", code: "BR" },
      61: { name: "Australia", code: "AU" },
    };

    // Try to match country codes
    for (let i = 3; i >= 1; i--) {
      const code = cleaned.substring(0, i);
      if (countryCodes[code]) {
        return {
          countryCode: code,
          ...countryCodes[code],
          nationalNumber: cleaned.substring(i),
        };
      }
    }

    // If no match found and it's 10 digits, assume Indian
    if (cleaned.length === 10 && this.isValidIndianMobile(cleaned)) {
      return {
        countryCode: "91",
        name: "India",
        code: "IN",
        nationalNumber: cleaned,
      };
    }

    return {
      countryCode: "unknown",
      name: "Unknown",
      code: "XX",
      nationalNumber: cleaned,
    };
  }

  // Check if number can receive SMS
  static canReceiveSMS(phoneNumber) {
    const info = this.getCountryInfo(phoneNumber);

    // List of supported countries/regions
    const supportedCountries = ["US", "CA", "UK", "IN", "AU"];

    return supportedCountries.includes(info.code);
  }

  // Validate for specific providers
  static validateForProvider(phoneNumber, provider) {
    const errors = [];

    if (!this.isValid(phoneNumber)) {
      errors.push("Invalid phone number format");
    }

    const info = this.getCountryInfo(phoneNumber);

    switch (provider) {
      case "msg91":
        if (info.code !== "IN") {
          errors.push("MSG91 only supports Indian phone numbers");
        }
        break;

      case "twilio":
        if (!this.canReceiveSMS(phoneNumber)) {
          errors.push("Phone number may not be supported by Twilio");
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      info,
    };
  }
}

module.exports = PhoneNumberValidator;
