import { tool } from "@openai/agents/realtime";
import { z } from "zod";

// Conversion constants organized by category
const CONVERSIONS = {
  length: {
    toBase: {
      meters: 1,
      kilometers: 1000,
      feet: 0.3048,
      inches: 0.0254,
      miles: 1609.344,
      centimeters: 0.01,
    },
    fromBase: {
      meters: 1,
      kilometers: 0.001,
      feet: 3.28084,
      inches: 39.3701,
      miles: 0.000621371,
      centimeters: 100,
    },
    baseUnit: "meters",
  },
  weight: {
    toBase: {
      kilograms: 1,
      grams: 0.001,
      pounds: 0.45359237,
      ounces: 0.028349523125,
    },
    fromBase: {
      kilograms: 1,
      grams: 1000,
      pounds: 2.20462,
      ounces: 35.274,
    },
    baseUnit: "kilograms",
  },
  volume: {
    toBase: {
      liters: 1,
      milliliters: 0.001,
      gallons: 3.78541,
      quarts: 0.946353,
      pints: 0.473176,
      cups: 0.236588,
      fluid_ounces: 0.0295735,
      tablespoons: 0.0147868,
      teaspoons: 0.00492892,
    },
    fromBase: {
      liters: 1,
      milliliters: 1000,
      gallons: 0.264172,
      quarts: 1.05669,
      pints: 2.11338,
      cups: 4.22675,
      fluid_ounces: 33.814,
      tablespoons: 67.628,
      teaspoons: 202.884,
    },
    baseUnit: "liters",
  },
};

const round = (n: number, decimals: number = 3) => {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
};

export const unitConversionTool = tool({
  name: "unit_conversion",
  description:
    "Convert between metric and imperial units for length, weight, volume, temperature, and time formats (24h, military, AM/PM).",
  parameters: z.object({
    category: z
      .enum(["length", "weight", "volume", "temperature", "time"])
      .describe("Type of conversion to perform."),
    from: z
      .enum([
        // length
        "meters",
        "kilometers",
        "feet",
        "inches",
        "miles",
        "centimeters",
        // weight
        "grams",
        "kilograms",
        "pounds",
        "ounces",
        // volume
        "liters",
        "milliliters",
        "gallons",
        "quarts",
        "pints",
        "cups",
        "fluid_ounces",
        "tablespoons",
        "teaspoons",
        // temperature
        "celsius",
        "fahrenheit",
        "kelvin",
        // time
        "24h",
        "12h",
        "military",
      ])
      .optional(),
    to: z
      .enum([
        // length
        "meters",
        "kilometers",
        "feet",
        "inches",
        "miles",
        "centimeters",
        // weight
        "grams",
        "kilograms",
        "pounds",
        "ounces",
        // volume
        "liters",
        "milliliters",
        "gallons",
        "quarts",
        "pints",
        "cups",
        "fluid_ounces",
        "tablespoons",
        "teaspoons",
        // temperature
        "celsius",
        "fahrenheit",
        "kelvin",
        // time
        "24h",
        "12h",
        "military",
      ])
      .optional(),
    value: z.number().optional(),
    time: z.string().optional(),
  }),
  async execute(params) {
    const { category, from, to, value, time } = params;

    // Temperature conversion
    if (category === "temperature") {
      if (value == null || !from || !to) {
        return "Please provide 'from', 'to', and numeric 'value' for temperature conversion.";
      }

      // Convert to Celsius as base
      let celsius: number;
      switch (from) {
        case "celsius":
          celsius = value;
          break;
        case "fahrenheit":
          celsius = (value - 32) * (5 / 9);
          break;
        case "kelvin":
          celsius = value - 273.15;
          break;
        default:
          return "Unsupported temperature unit.";
      }

      // Convert from Celsius to target
      let result: number;
      switch (to) {
        case "celsius":
          result = celsius;
          break;
        case "fahrenheit":
          result = celsius * (9 / 5) + 32;
          break;
        case "kelvin":
          result = celsius + 273.15;
          break;
        default:
          return "Unsupported temperature unit.";
      }

      return `${round(value)} ${from} = ${round(result)} ${to}`;
    }

    // Time conversion
    if (category === "time") {
      if (!from || !to || !time) {
        return "Please provide 'from', 'to', and 'time' string for time conversion.";
      }

      const timeParser = {
        "24h": (t: string) => {
          const match = t.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
          return match
            ? { h: parseInt(match[1], 10), m: parseInt(match[2], 10) }
            : null;
        },
        military: (t: string) => {
          const match = t.match(/^([01]?\d|2[0-3])([0-5]\d)$/);
          return match
            ? { h: parseInt(match[1], 10), m: parseInt(match[2], 10) }
            : null;
        },
        "12h": (t: string) => {
          const match = t.match(/^(0?\d|1[0-2]):([0-5]\d)\s*([AP]M)$/i);
          if (!match) return null;
          let h = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          const ampm = match[3].toUpperCase();
          if (ampm === "PM" && h !== 12) h += 12;
          if (ampm === "AM" && h === 12) h = 0;
          return { h, m };
        },
      };

      const parsed = timeParser[from as keyof typeof timeParser]?.(time);
      if (!parsed) return "Invalid input time format.";

      const formatters = {
        "24h": (hm: { h: number; m: number }) =>
          `${String(hm.h).padStart(2, "0")}:${String(hm.m).padStart(2, "0")}`,
        military: (hm: { h: number; m: number }) =>
          `${String(hm.h).padStart(2, "0")}${String(hm.m).padStart(2, "0")}`,
        "12h": (hm: { h: number; m: number }) => {
          const ampm = hm.h >= 12 ? "PM" : "AM";
          let h = hm.h % 12;
          if (h === 0) h = 12;
          return `${h}:${String(hm.m).padStart(2, "0")} ${ampm}`;
        },
      };

      const formatted = formatters[to as keyof typeof formatters]?.(parsed);
      if (!formatted) return "Unsupported target time format.";

      return `${time} (${from}) = ${formatted} (${to})`;
    }

    // Generic conversion for length, weight, and volume
    if (
      category === "length" ||
      category === "weight" ||
      category === "volume"
    ) {
      if (value == null || !from || !to) {
        return `Please provide 'from', 'to', and numeric 'value' for ${category} conversion.`;
      }

      const conversion = CONVERSIONS[category];
      if (
        !conversion.toBase[from as keyof typeof conversion.toBase] ||
        !conversion.fromBase[to as keyof typeof conversion.fromBase]
      ) {
        return `Unsupported ${category} unit.`;
      }

      // Convert to base unit, then to target unit
      const baseValue =
        value * conversion.toBase[from as keyof typeof conversion.toBase];
      const result =
        baseValue * conversion.fromBase[to as keyof typeof conversion.fromBase];

      return `${round(value)} ${from} = ${round(result)} ${to}`;
    }

    return "Unsupported conversion category.";
  },
});
