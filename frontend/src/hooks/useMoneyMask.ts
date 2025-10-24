import { useEffect, useRef } from 'react';
import VMasker from 'vanilla-masker';

export const useMoneyMask = (value: string, onChange: (value: string) => void) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      // Aplicar máscara monetária
      VMasker(inputRef.current).maskMoney({
        precision: 2,
        separator: ',',
        delimiter: '.',
        unit: '',
        zeroCents: false
      });

      // Adicionar listener para capturar mudanças
      const handleInput = (event: Event) => {
        const target = event.target as HTMLInputElement;
        console.log('Raw input value:', target.value); // Debug
        onChange(target.value);
      };

      inputRef.current.addEventListener('input', handleInput);

      return () => {
        if (inputRef.current) {
          inputRef.current.removeEventListener('input', handleInput);
        }
      };
    }
  }, []);

  // Atualizar o valor do input quando o valor externo mudar
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  return inputRef;
};
