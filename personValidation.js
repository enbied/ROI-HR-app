const normalizePhone = (phone = '') => phone.replace(/\D/g, '');

export const validatePerson = (person) => {
  return (
    person.name?.trim() &&
    /^\d{10}$/.test(normalizePhone(person.phone)) &&
    person.addressStreet?.trim() &&
    person.addressCity?.trim() &&
    person.addressStateTerr &&
    /^\d{4}$/.test(person.addressPostcode) &&
    person.department &&
    person.permissionsType
  );
};

export const isDuplicatePerson = (person, people) => {
  return people.some((p) => {
    // Ignore the current person when editing
    if (person.id && p.id === person.id) {
      return false;
    }

    return (
      p.name.trim().toLowerCase() === person.name.trim().toLowerCase() &&
      normalizePhone(p.phone) === normalizePhone(person.phone)
    );
  });
};

export const validateAndCheckDuplicate = (person, people) => {
  return (
    validatePerson(person) &&
    !isDuplicatePerson(person, people)
  );
};