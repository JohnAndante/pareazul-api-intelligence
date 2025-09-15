export class StringUtil {
    static clearPlate(plate: string): string {
        return plate.replace(/[^A-Z0-9]/g, '').toUpperCase();
    }
}
