import { tool } from "@openai/agents/realtime";
import { z } from "zod";

const conversionMap = {
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
  },
} as const;

const round = (value: number, decimals: number = 3) => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
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
        "meters",
        "kilometers",
        "feet",
        "inches",
        "miles",
        "centimeters",
        "grams",
        "kilograms",
        "pounds",
        "ounces",
        "liters",
        "milliliters",
        "gallons",
        "quarts",
        "pints",
        "cups",
        "fluid_ounces",
        "tablespoons",
        "teaspoons",
        "celsius",
        "fahrenheit",
        "kelvin",
        "24h",
        "12h",
        "military",
      ])
      .optional(),
    to: z
      .enum([
        "meters",
        "kilometers",
        "feet",
        "inches",
        "miles",
        "centimeters",
        "grams",
        "kilograms",
        "pounds",
        "ounces",
        "liters",
        "milliliters",
        "gallons",
        "quarts",
        "pints",
        "cups",
        "fluid_ounces",
        "tablespoons",
        "teaspoons",
        "celsius",
        "fahrenheit",
        "kelvin",
        "24h",
        "12h",
        "military",
      ])
      .optional(),
    value: z.number().optional(),
    time: z.string().optional(),
  }),
  async execute({ category, from, to, value }) {
    console.log("Executing unit conversion:", { category, from, to, value });

    if (value == null || typeof value !== "number") {
      throw new Error("Invalid 'value' argument. Must be a number.");
    }

    if (category === "temperature") {
      if (from === "celsius" && to === "fahrenheit") {
        return { value: round((value * 9) / 5 + 32), unit: to };
      }
      if (from === "fahrenheit" && to === "celsius") {
        return { value: round(((value - 32) * 5) / 9), unit: to };
      }
      if (from === "celsius" && to === "kelvin") {
        return { value: round(value + 273.15), unit: to };
      }
      if (from === "kelvin" && to === "celsius") {
        return { value: round(value - 273.15), unit: to };
      }
      if (from === "fahrenheit" && to === "kelvin") {
        return {
          value: round(((value - 32) * 5) / 9 + 273.15),
          unit: to,
        };
      }
      if (from === "kelvin" && to === "fahrenheit") {
        return {
          value: round(((value - 273.15) * 9) / 5 + 32),
          unit: to,
        };
      }
      throw new Error(`Unsupported temperature conversion: ${from} to ${to}`);
    }

    if (category === "time") {
      if (!from || !to) {
        throw new Error(
          "Time conversion requires both 'from' and 'to' formats."
        );
      }

      // Parse time input (expects format like "14:30" or "2:30 PM")
      const timeStr = String(value);
      let hours = 0;
      let minutes = 0;

      if (from === "12h") {
        // Parse 12-hour format (e.g., "2:30 PM")
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) {
          throw new Error(
            "Invalid 12-hour time format. Expected format: '2:30 PM'"
          );
        }
        hours = parseInt(match[1]);
        minutes = parseInt(match[2]);
        const period = match[3].toUpperCase();

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
      } else {
        // Parse 24-hour format (e.g., "14:30")
        const match = timeStr.match(/(\d+):(\d+)/);
        if (!match) {
          throw new Error(
            "Invalid 24-hour time format. Expected format: '14:30'"
          );
        }
        hours = parseInt(match[1]);
        minutes = parseInt(match[2]);
      }

      // Convert to target format
      if (to === "12h") {
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return {
          value: `${displayHours}:${minutes
            .toString()
            .padStart(2, "0")} ${period}`,
          unit: to,
        };
      } else if (to === "24h" || to === "military") {
        return {
          value: `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`,
          unit: to,
        };
      }

      throw new Error(`Unsupported time conversion: ${from} to ${to}`);
    }

    const convCategory =
      conversionMap[category as "length" | "weight" | "volume"];
    if (!convCategory) {
      throw new Error(`Invalid conversion category: ${category}`);
    }

    const fromUnit = from as keyof typeof convCategory.toBase;
    const toUnit = to as keyof typeof convCategory.fromBase;

    if (!convCategory.toBase[fromUnit] || !convCategory.fromBase[toUnit]) {
      throw new Error(`Invalid units for ${category}: ${from} to ${to}`);
    }

    const toBase = convCategory.toBase[fromUnit];
    const fromBase = convCategory.fromBase[toUnit];

    const baseValue = value * toBase;
    const result = baseValue * fromBase;

    return {
      value: round(result),
      unit: to,
    };
  },
});
