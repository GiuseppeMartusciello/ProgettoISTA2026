import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsSameDay(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isSameDay',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const obj = args.object as any;
          const start = new Date(obj.startTime);
          const end = new Date(obj.endTime);

          if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

          const sameDay =
            start.getUTCFullYear() === end.getUTCFullYear() &&
            start.getUTCMonth() === end.getUTCMonth() &&
            start.getUTCDate() === end.getUTCDate();

          // Deve essere nello stesso giorno, start < end, e almeno 60 minuti
          return sameDay && start < end;
        },
        defaultMessage() {
          return `startTime deve essere precedente a endTime e devono essere nello stesso giorno`;
        },
      },
    });
  };
}
