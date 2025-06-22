import * as bcrypt from 'bcrypt';

/**
 * Helper para utilidades relacionadas con usuarios.
 * Centraliza la lógica de hash de contraseñas y otras operaciones.
 */
export class UserUtilsHelper {
  /**
   * Genera un hash de la contraseña usando bcrypt.
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12; // Número de rondas de salt (balance entre seguridad y rendimiento)
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verifica si una contraseña coincide con el hash.
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Genera un nombre de usuario sugerido basado en un nombre base.
   * Útil para evitar duplicados automáticamente.
   */
  static generateSuggestedUsername(baseName: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const cleanName = baseName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${cleanName}_${timestamp}`;
  }

  /**
   * Valida la fortaleza de una contraseña.
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let isValid = true;

    // Verificar longitud mínima
    if (password.length < 8) {
      isValid = false;
      suggestions.push('La contraseña debe tener al menos 8 caracteres');
    }

    // Verificar que contenga al menos una letra mayúscula
    if (!/[A-Z]/.test(password)) {
      suggestions.push('La contraseña debe contener al menos una letra mayúscula');
    }

    // Verificar que contenga al menos una letra minúscula
    if (!/[a-z]/.test(password)) {
      suggestions.push('La contraseña debe contener al menos una letra minúscula');
    }

    // Verificar que contenga al menos un número
    if (!/\d/.test(password)) {
      suggestions.push('La contraseña debe contener al menos un número');
    }

    // Verificar que contenga al menos un carácter especial
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      suggestions.push('La contraseña debe contener al menos un carácter especial');
    }

    return { isValid, suggestions };
  }

  /**
   * Sanitiza los datos del usuario para respuestas de la API.
   * Remueve información sensible como la contraseña.
   */
  static sanitizeUserData(user: any): any {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
