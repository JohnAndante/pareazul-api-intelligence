// A interface define a "entrada" que nossas funções esperam.
// O LangChain vai aprender a montar objetos com este formato.
interface MathInput {
  a: number;
  b: number;
}

class MathTool {
  public add({ a, b }: MathInput): number {
    console.log(`[MathService] Executing add: ${a} + ${b}`);
    return a + b;
  }

  public subtract({ a, b }: MathInput): number {
    console.log(`[MathService] Executing subtract: ${a} - ${b}`);
    return a - b;
  }

  public multiply({ a, b }: MathInput): number {
    console.log(`[MathService] Executing multiply: ${a} * ${b}`);
    return a * b;
  }

  public divide({ a, b }: MathInput): number {
    if (b === 0) {
      throw new Error('Cannot divide by zero.');
    }
    console.log(`[MathService] Executing divide: ${a} / ${b}`);
    return a / b;
  }

  public power({ a, b }: MathInput): number {
    console.log(`[MathService] Executing power: ${a} ^ ${b}`);
    return Math.pow(a, b);
  }
}

// Exportamos uma única instância para ser usada em todo o app (Singleton)
export const mathTool = new MathTool();
