class Utils {
    // Function to compute Julian Date
    static getJulianDate(date) {
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth() + 1; // Months are zero-based in JS
        const day = date.getUTCDate();
        const hour = date.getUTCHours();
        const minute = date.getUTCMinutes();
        const second = date.getUTCSeconds();

        let A = Math.floor(year / 100);
        let B = 2 - A + Math.floor(A / 4);

        if (month <= 2) {
            year -= 1;
            month += 12;
        }

        const JD =
            Math.floor(365.25 * (year + 4716)) +
            Math.floor(30.6001 * (month + 1)) +
            day +
            B -
            1524.5 +
            (hour + minute / 60 + second / 3600) / 24;

        return JD;
    }

    // Function to compute Greenwich Mean Sidereal Time (GMST)
    static getGMST(date) {
        const JD = this.getJulianDate(date);
        const T = (JD - 2451545.0) / 36525.0;
        let GMST =
            280.46061837 +
            360.98564736629 * (JD - 2451545.0) +
            0.000387933 * T * T -
            (T * T * T) / 38710000.0;

        GMST = GMST % 360.0;
        if (GMST < 0) GMST += 360.0;
        return GMST; // In degrees
    }

    // Function to compute Local Sidereal Time (LST)
    static getLocalSiderealTime(longitude) {
        const now = new Date();
        const GMST = this.getGMST(now);
        let LST = GMST + longitude;
        LST = LST % 360.0;
        if (LST < 0) LST += 360.0;
        return LST; // In degrees
    }

    // Function to convert Equatorial Coordinates to Horizontal Coordinates
    static equatorialToHorizontal(ra, dec, latitude, lst) {
        const raRad = THREE.Math.degToRad(ra); // RA in radians
        const decRad = THREE.Math.degToRad(dec); // Dec in radians
        const latRad = THREE.Math.degToRad(latitude);
        const lstRad = THREE.Math.degToRad(lst);

        let H = lstRad - raRad; // Hour Angle in radians
        H = ((H + Math.PI) % (2 * Math.PI)) - Math.PI; // Normalize H to [-π, π)

        const sinAlt =
            Math.sin(decRad) * Math.sin(latRad) +
            Math.cos(decRad) * Math.cos(latRad) * Math.cos(H);
        const altitude = Math.asin(sinAlt);

        const cosAz =
            (Math.sin(decRad) - Math.sin(altitude) * Math.sin(latRad)) /
            (Math.cos(altitude) * Math.cos(latRad));
        const sinAz = (-Math.cos(decRad) * Math.sin(H)) / Math.cos(altitude);
        let azimuth = Math.atan2(sinAz, cosAz);

        azimuth = (azimuth + 2 * Math.PI) % (2 * Math.PI); // Normalize to [0, 2π)

        return {
            altitude: THREE.Math.radToDeg(altitude),
            azimuth: THREE.Math.radToDeg(azimuth),
        };
    }

    static bvToRgb(bv) {
        let r, g, b, t;
      
        // Clamp BV values to the range [-0.4, 2.0]
        bv = Math.max(-0.4, Math.min(bv, 2.0));
      
        // Red component
        if (bv < 0.0) {
          t = (bv + 0.4) / (0.4 + 0.4);
          r = 0.61 + 0.11 * t + 0.1 * t * t;
        } else if (bv < 0.4) {
          t = (bv - 0.0) / (0.4 - 0.0);
          r = 0.83 + 0.17 * t;
        } else if (bv < 2.1) {
          t = (bv - 0.4) / (2.1 - 0.4);
          r = 1.0;
        }
      
        // Green component
        if (bv < -0.4) {
          t = (bv + 0.4) / (0.0 + 0.4);
          g = 0.70 + 0.07 * t + 0.1 * t * t;
        } else if (bv < 0.0) {
          t = (bv + 0.4) / (0.0 + 0.4);
          g = 0.87 + 0.11 * t;
        } else if (bv < 0.4) {
          t = (bv - 0.0) / (0.4 - 0.0);
          g = 0.87 + 0.11 * t;
        } else if (bv < 1.6) {
          t = (bv - 0.4) / (1.6 - 0.4);
          g = 0.98 - 0.16 * t;
        } else if (bv < 2.0) {
          t = (bv - 1.6) / (2.0 - 1.6);
          g = 0.82 - 0.5 * t * t;
        }
      
        // Blue component
        if (bv < -0.4) {
          b = 1.0;
        } else if (bv < 0.0) {
          t = (bv + 0.4) / (0.0 + 0.4);
          b = 1.0;
        } else if (bv < 0.4) {
          t = (bv - 0.0) / (0.4 - 0.0);
          b = 1.0 - 0.47 * t + 0.1 * t * t;
        } else if (bv < 1.5) {
          t = (bv - 0.4) / (1.5 - 0.4);
          b = 0.63 - 0.6 * t * t;
        } else {
          b = 0.0;
        }
      
        // Apply a gamma correction to soften colors
        const gamma = 2.2;
        r = Math.pow(r, 1 / gamma);
        g = Math.pow(g, 1 / gamma);
        b = Math.pow(b, 1 / gamma);
      
        // Reduce intensity slightly to avoid oversaturation
        const intensityFactor = 0.95;
        return {
          r: r * intensityFactor,
          g: g * intensityFactor,
          b: b * intensityFactor,
        };
      }

}