const MATH_FUNCTIONS = ['Math.sqrt', 'Math.pow', 'Math.round', 'Math.ceil', 'Math.floor', 'Math.abs', 'Math.PI', 'Math.E'];

function sanitizeExpression(expr) {
  let sanitized = expr
    .replace(/\bsqrt\s*\(/g, 'Math.sqrt(')
    .replace(/\bpow\s*\(/g, 'Math.pow(')
    .replace(/\bround\s*\(/g, 'Math.round(')
    .replace(/\bceil\s*\(/g, 'Math.ceil(')
    .replace(/\bfloor\s*\(/g, 'Math.floor(')
    .replace(/\babs\s*\(/g, 'Math.abs(')
    .replace(/\bPI\b/g, 'Math.PI')
    .replace(/\bpi\b/g, 'Math.PI');

  // Remove all allowed tokens and check if anything remains
  let check = sanitized;
  // Remove Math function names and constants
  for (const fn of MATH_FUNCTIONS) {
    while (check.includes(fn)) {
      check = check.replace(fn, '');
    }
  }
  // Remove allowed characters: digits, operators, parens, dots, spaces
  check = check.replace(/[0-9+\-*/%().\s]/g, '');

  if (check.length > 0) {
    throw new Error(`Disallowed characters in expression: "${check}"`);
  }

  return sanitized;
}

const CONVERSION_FACTORS = {
  // Length - everything relative to meters
  length: {
    m: 1, meter: 1, meters: 1,
    km: 1000, kilometer: 1000, kilometers: 1000,
    cm: 0.01, centimeter: 0.01, centimeters: 0.01,
    mm: 0.001, millimeter: 0.001, millimeters: 0.001,
    mi: 1609.344, mile: 1609.344, miles: 1609.344,
    ft: 0.3048, foot: 0.3048, feet: 0.3048,
    in: 0.0254, inch: 0.0254, inches: 0.0254,
    yd: 0.9144, yard: 0.9144, yards: 0.9144,
  },
  // Weight - everything relative to grams
  weight: {
    g: 1, gram: 1, grams: 1,
    kg: 1000, kilogram: 1000, kilograms: 1000,
    mg: 0.001, milligram: 0.001, milligrams: 0.001,
    lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592,
    oz: 28.3495, ounce: 28.3495, ounces: 28.3495,
  },
  // Volume - everything relative to milliliters
  volume: {
    ml: 1, milliliter: 1, milliliters: 1,
    l: 1000, liter: 1000, liters: 1000,
    gal: 3785.41, gallon: 3785.41, gallons: 3785.41,
    cup: 236.588, cups: 236.588,
    pt: 473.176, pint: 473.176, pints: 473.176,
    qt: 946.353, quart: 946.353, quarts: 946.353,
    floz: 29.5735, fl_oz: 29.5735,
    tbsp: 14.7868, tablespoon: 14.7868, tablespoons: 14.7868,
    tsp: 4.92892, teaspoon: 4.92892, teaspoons: 4.92892,
  },
};

const TEMP_UNITS = ['f', 'c', 'k', 'fahrenheit', 'celsius', 'kelvin'];

function normalizeUnit(unit) {
  return unit.toLowerCase().trim();
}

function isTemperature(unit) {
  return TEMP_UNITS.includes(normalizeUnit(unit));
}

function convertTemperature(value, from, to) {
  const f = normalizeUnit(from);
  const t = normalizeUnit(to);

  // Normalize to Celsius first
  let celsius;
  if (f === 'c' || f === 'celsius') celsius = value;
  else if (f === 'f' || f === 'fahrenheit') celsius = (value - 32) * 5 / 9;
  else if (f === 'k' || f === 'kelvin') celsius = value - 273.15;
  else throw new Error(`Unknown temperature unit: ${from}`);

  // Convert from Celsius to target
  if (t === 'c' || t === 'celsius') return celsius;
  if (t === 'f' || t === 'fahrenheit') return celsius * 9 / 5 + 32;
  if (t === 'k' || t === 'kelvin') return celsius + 273.15;
  throw new Error(`Unknown temperature unit: ${to}`);
}

function findConversionCategory(unit) {
  const normalized = normalizeUnit(unit);
  for (const [category, factors] of Object.entries(CONVERSION_FACTORS)) {
    if (normalized in factors) return category;
  }
  return null;
}

function convertUnit(value, from, to) {
  const fromNorm = normalizeUnit(from);
  const toNorm = normalizeUnit(to);

  if (isTemperature(fromNorm) || isTemperature(toNorm)) {
    return convertTemperature(value, fromNorm, toNorm);
  }

  const fromCategory = findConversionCategory(fromNorm);
  const toCategory = findConversionCategory(toNorm);

  if (!fromCategory) throw new Error(`Unknown unit: ${from}`);
  if (!toCategory) throw new Error(`Unknown unit: ${to}`);
  if (fromCategory !== toCategory) throw new Error(`Cannot convert between ${fromCategory} and ${toCategory}`);

  const baseValue = value * CONVERSION_FACTORS[fromCategory][fromNorm];
  return baseValue / CONVERSION_FACTORS[toCategory][toNorm];
}

export const calcTools = [
  {
    name: 'calc.evaluate',
    description: 'Evaluate a mathematical expression and return the result. Use for any arithmetic, percentages, tips, splits, etc.',
    parameters: { type: 'object', properties: { expression: { type: 'string' } }, required: ['expression'] },
    handler: ({ expression }) => {
      const sanitized = sanitizeExpression(expression);
      const result = new Function('return ' + sanitized)();
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Expression did not evaluate to a valid number');
      }
      return { result, expression: sanitized };
    },
  },
  {
    name: 'calc.convert',
    description: 'Convert between units. Supports: length (miles/km/meters/feet/inches/cm), weight (lbs/kg/oz/g), temperature (F/C/K), volume (gallons/liters/cups/ml).',
    parameters: { type: 'object', properties: { value: { type: 'number' }, from_unit: { type: 'string' }, to_unit: { type: 'string' } }, required: ['value', 'from_unit', 'to_unit'] },
    handler: ({ value, from_unit, to_unit }) => {
      const result = convertUnit(value, from_unit, to_unit);
      const rounded = Math.round(result * 1000000) / 1000000;
      return { result: rounded, from: from_unit, to: to_unit, expression: `${value} ${from_unit} = ${rounded} ${to_unit}` };
    },
  },
  {
    name: 'calc.tip',
    description: 'Calculate tip and total for a bill.',
    parameters: { type: 'object', properties: { bill_amount: { type: 'number' }, tip_percent: { type: 'number' }, split_ways: { type: 'number' } }, required: ['bill_amount', 'tip_percent'] },
    handler: ({ bill_amount, tip_percent, split_ways }) => {
      const tip = Math.round(bill_amount * (tip_percent / 100) * 100) / 100;
      const total = Math.round((bill_amount + tip) * 100) / 100;
      const result = { tip, total };
      if (split_ways && split_ways > 1) {
        result.per_person = Math.round((total / split_ways) * 100) / 100;
      }
      return result;
    },
  },
  {
    name: 'calc.percentage',
    description: 'Calculate percentages: what is X% of Y, X is what % of Y, % change from X to Y.',
    parameters: { type: 'object', properties: { operation: { type: 'string', enum: ['of', 'is_what_percent', 'change'] }, x: { type: 'number' }, y: { type: 'number' } }, required: ['operation', 'x', 'y'] },
    handler: ({ operation, x, y }) => {
      let result, description;
      switch (operation) {
        case 'of':
          result = Math.round((x / 100) * y * 1000000) / 1000000;
          description = `${x}% of ${y} = ${result}`;
          break;
        case 'is_what_percent':
          result = Math.round((x / y) * 100 * 1000000) / 1000000;
          description = `${x} is ${result}% of ${y}`;
          break;
        case 'change':
          result = Math.round(((y - x) / Math.abs(x)) * 100 * 1000000) / 1000000;
          description = `Change from ${x} to ${y} = ${result}%`;
          break;
        default:
          throw new Error(`Unknown operation: ${operation}. Use "of", "is_what_percent", or "change".`);
      }
      return { result, description };
    },
  },
];
