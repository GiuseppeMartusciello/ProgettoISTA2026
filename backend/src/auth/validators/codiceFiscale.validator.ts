import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
const CodiceFiscale  = require( 'codice-fiscale-js');

@ValidatorConstraint({ async: false })
export class IsCodiceFiscaleConstraint implements ValidatorConstraintInterface {
  validate(codiceFiscale: string) {
    return CodiceFiscale.check(codiceFiscale); 
  }

  defaultMessage() {
    return 'Codice Fiscale non valido';
  }
}

export function IsCodiceFiscale(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCodiceFiscaleConstraint,
    });
  };
}
