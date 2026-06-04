/**
 * Input Component
 * Reusable input field component
 * Supports text, email, password, and other input types
 */

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
}

export function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  disabled,
  required,
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className="input"
    />
  );
}
