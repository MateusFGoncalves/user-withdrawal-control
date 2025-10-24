import VMasker from 'vanilla-masker';

/**
 * Configuração padrão para formatação de moeda
 */
export const currencyConfig = {
    precision: 2,
    separator: ',',
    delimiter: '.',
    unit: '',
    zeroCents: false
};

/**
 * Formata um valor numérico como moeda usando VanillaMasker
 * @param value - Valor numérico para formatar
 * @returns String formatada como moeda
 */
export const formatCurrency = (value: number): any => {
    return VMasker.toMoney(value, currencyConfig);
};

/**
 * Converte uma string formatada como moeda para número usando VanillaMasker
 * @param value - String formatada como moeda
 * @returns Número convertido ou 0 se inválido
 */
export const parseCurrency = (value: string): any => {
    return VMasker.toNumber(value) || 0;
};

/**
 * Aplica máscara monetária em um elemento de input
 * @param input - Elemento HTML input
 */
export const applyCurrencyMask = (input: HTMLInputElement | null): void => {
    if (input) {
        VMasker(input).maskMoney(currencyConfig);
    }
};

/**
 * Aplica máscara monetária em múltiplos elementos de input
 * @param inputs - Array ou objeto com elementos HTML input
 */
export const applyCurrencyMaskToInputs = (inputs: (HTMLInputElement | null)[] | Record<string, HTMLInputElement | null>): void => {
    const inputArray = Array.isArray(inputs) ? inputs : Object.values(inputs);
    
    inputArray.forEach(input => {
        applyCurrencyMask(input);
    });
};
