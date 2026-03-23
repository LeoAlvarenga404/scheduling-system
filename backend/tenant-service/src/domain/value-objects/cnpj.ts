export class CNPJ {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): CNPJ {
    const numericValue = value.replace(/\D/g, '');
    if (!CNPJ.isValid(numericValue)) {
      throw new Error('Invalid CNPJ');
    }
    return new CNPJ(numericValue);
  }

  public getValue(): string {
    return this.value;
  }

  public getFormattedValue(): string {
    return this.value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  private static isValid(cnpj: string): boolean {
    if (cnpj.length !== 14) return false;
    
    // Quick checks for repeated digits
    if (/^(\d)\1+$/.test(cnpj)) return false;

    // Validate using the check digits algorithm
    let calcLength = cnpj.length - 2;
    let numbers = cnpj.substring(0, calcLength);
    const digits = cnpj.substring(calcLength);
    let sum = 0;
    let pos = calcLength - 7;
    for (let i = calcLength; i >= 1; i--) {
      sum += Number(numbers.charAt(calcLength - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== Number(digits.charAt(0))) return false;

    calcLength = calcLength + 1;
    numbers = cnpj.substring(0, calcLength);
    sum = 0;
    pos = calcLength - 7;
    for (let i = calcLength; i >= 1; i--) {
      sum += Number(numbers.charAt(calcLength - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== Number(digits.charAt(1))) return false;

    return true;
  }
}
