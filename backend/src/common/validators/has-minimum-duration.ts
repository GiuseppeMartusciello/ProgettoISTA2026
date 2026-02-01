import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function HasMinimumDuration(
  minMinutes: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'hasMinimumDuration',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const { startTime, endTime } = args.object as any;
          if (!startTime || !endTime) return false;

          const start = new Date(startTime);
          const end = new Date(endTime);

          if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

          const durationMinutes =
            (end.getTime() - start.getTime()) / (1000 * 60);
          return durationMinutes >= minMinutes;
        },
        defaultMessage: () =>
          `The minimum duration of avaibility must be ${minMinutes} minutes.`,
      },
    });
  };
}
