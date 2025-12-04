/**
 * Form Extractor
 *
 * Extracts form fields, labels, and structure from HTML documents.
 * Preserves all field information for accurate recreation.
 */

import type { PageForm, FormField } from './types';

/**
 * Extract all forms from a document
 */
export function extractForms(document: Document): PageForm[] {
  const forms: PageForm[] = [];

  document.querySelectorAll('form').forEach((form: Element) => {
    const fields = extractFormFields(form, document);

    // Skip empty forms or forms with only hidden fields
    const visibleFields = fields.filter((f) => f.type !== 'hidden');
    if (visibleFields.length === 0) return;

    const submitButton = form.querySelector(
      'button[type="submit"], input[type="submit"], button:not([type])'
    );

    const formData: PageForm = {
      id: form.getAttribute('id') || undefined,
      action: form.getAttribute('action') || undefined,
      method: (form.getAttribute('method')?.toUpperCase() as 'GET' | 'POST') || 'POST',
      formType: detectFormType(fields, form),
      fields,
      submitText: extractSubmitText(submitButton) || 'Submit',
    };

    forms.push(formData);
  });

  return forms;
}

/**
 * Extract all fields from a form
 */
function extractFormFields(form: Element, document: Document): FormField[] {
  const fields: FormField[] = [];
  const processedNames = new Set<string>();

  // Process input elements
  form.querySelectorAll('input').forEach((input: Element) => {
    const field = extractInputField(input, form, document);
    if (field && !processedNames.has(field.name)) {
      fields.push(field);
      processedNames.add(field.name);
    }
  });

  // Process textarea elements
  form.querySelectorAll('textarea').forEach((textarea: Element) => {
    const field = extractTextareaField(textarea, form, document);
    if (field && !processedNames.has(field.name)) {
      fields.push(field);
      processedNames.add(field.name);
    }
  });

  // Process select elements
  form.querySelectorAll('select').forEach((select: Element) => {
    const field = extractSelectField(select, form, document);
    if (field && !processedNames.has(field.name)) {
      fields.push(field);
      processedNames.add(field.name);
    }
  });

  return fields;
}

/**
 * Extract data from an input element
 */
function extractInputField(input: Element, form: Element, document: Document): FormField | null {
  const type = input.getAttribute('type')?.toLowerCase() || 'text';
  const name = input.getAttribute('name') || input.getAttribute('id') || '';

  // Skip buttons
  if (type === 'submit' || type === 'button' || type === 'reset' || type === 'image') {
    return null;
  }

  // Map HTML5 input types to our types
  const typeMapping: Record<string, FormField['type']> = {
    text: 'text',
    email: 'email',
    tel: 'tel',
    phone: 'tel',
    number: 'number',
    checkbox: 'checkbox',
    radio: 'radio',
    file: 'file',
    date: 'date',
    datetime: 'date',
    'datetime-local': 'date',
    time: 'date',
    password: 'password',
    hidden: 'hidden',
    url: 'url',
    search: 'search',
  };

  const mappedType = typeMapping[type] || 'other';

  // Find label
  const label = findLabelForInput(input, form, document);

  // Get options for radio/checkbox groups
  let options: string[] | undefined;
  if (type === 'radio' || type === 'checkbox') {
    options = extractRadioCheckboxOptions(name, form);
  }

  return {
    type: mappedType,
    name,
    label: label || formatLabelFromName(name),
    placeholder: input.getAttribute('placeholder') || undefined,
    required: input.hasAttribute('required'),
    options,
    defaultValue: input.getAttribute('value') || undefined,
  };
}

/**
 * Extract data from a textarea element
 */
function extractTextareaField(textarea: Element, form: Element, document: Document): FormField | null {
  const name = textarea.getAttribute('name') || textarea.getAttribute('id') || '';
  const label = findLabelForInput(textarea, form, document);

  return {
    type: 'textarea',
    name,
    label: label || formatLabelFromName(name),
    placeholder: textarea.getAttribute('placeholder') || undefined,
    required: textarea.hasAttribute('required'),
    defaultValue: textarea.textContent?.trim() || undefined,
  };
}

/**
 * Extract data from a select element
 */
function extractSelectField(select: Element, form: Element, document: Document): FormField | null {
  const name = select.getAttribute('name') || select.getAttribute('id') || '';
  const label = findLabelForInput(select, form, document);

  // Extract options
  const options: string[] = [];
  select.querySelectorAll('option').forEach((option: Element) => {
    const text = option.textContent?.trim();
    const value = option.getAttribute('value');

    // Skip placeholder options
    if (value === '' && text?.toLowerCase().includes('select')) {
      return;
    }

    if (text) {
      options.push(text);
    }
  });

  return {
    type: 'select',
    name,
    label: label || formatLabelFromName(name),
    required: select.hasAttribute('required'),
    options: options.length > 0 ? options : undefined,
  };
}

/**
 * Find the label associated with an input element
 */
function findLabelForInput(input: Element, form: Element, document: Document): string | undefined {
  // Method 1: Check for id and find matching label
  const id = input.getAttribute('id');
  if (id) {
    const label = form.querySelector(`label[for="${id}"]`) || document.querySelector(`label[for="${id}"]`);
    if (label?.textContent) {
      return cleanLabelText(label.textContent);
    }
  }

  // Method 2: Check for wrapping label
  const parentLabel = input.closest('label');
  if (parentLabel?.textContent) {
    // Remove the input's value from the label text
    let labelText = parentLabel.textContent;
    const inputValue = input.getAttribute('value');
    if (inputValue) {
      labelText = labelText.replace(inputValue, '');
    }
    return cleanLabelText(labelText);
  }

  // Method 3: Check for adjacent label (common pattern)
  const prevSibling = input.previousElementSibling;
  if (prevSibling?.tagName.toLowerCase() === 'label') {
    return cleanLabelText(prevSibling.textContent || '');
  }

  // Method 4: Check parent's previous sibling
  const parentPrevSibling = input.parentElement?.previousElementSibling;
  if (parentPrevSibling?.tagName.toLowerCase() === 'label') {
    return cleanLabelText(parentPrevSibling.textContent || '');
  }

  // Method 5: Look for aria-label
  const ariaLabel = input.getAttribute('aria-label');
  if (ariaLabel) {
    return cleanLabelText(ariaLabel);
  }

  // Method 6: Look for aria-labelledby
  const ariaLabelledBy = input.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelEl = document.getElementById(ariaLabelledBy);
    if (labelEl?.textContent) {
      return cleanLabelText(labelEl.textContent);
    }
  }

  return undefined;
}

/**
 * Clean label text by removing asterisks, extra whitespace, etc.
 */
function cleanLabelText(text: string): string {
  return text
    .replace(/\*+/g, '') // Remove asterisks (required indicators)
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[:：]$/g, '') // Remove trailing colons
    .trim();
}

/**
 * Format a field name into a human-readable label
 */
function formatLabelFromName(name: string): string {
  if (!name) return 'Field';

  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to spaces
    .replace(/[_-]/g, ' ') // underscores and dashes to spaces
    .replace(/\[\]/g, '') // Remove array brackets
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Extract options for radio button or checkbox groups
 */
function extractRadioCheckboxOptions(name: string, form: Element): string[] {
  const options: string[] = [];

  form.querySelectorAll(`input[name="${name}"]`).forEach((input: Element) => {
    // Try to find the label for this specific option
    const label = input.closest('label');
    let optionText: string | undefined;

    if (label) {
      optionText = label.textContent?.trim();
    } else {
      // Look for adjacent text node
      const nextSibling = input.nextSibling;
      if (nextSibling?.nodeType === 3) {
        // Text node
        optionText = nextSibling.textContent?.trim();
      }
    }

    // Fall back to value attribute
    if (!optionText) {
      optionText = input.getAttribute('value') || undefined;
    }

    if (optionText && !options.includes(optionText)) {
      options.push(optionText);
    }
  });

  return options;
}

/**
 * Extract submit button text
 */
function extractSubmitText(button: Element | null): string | undefined {
  if (!button) return undefined;

  // Check for value attribute (for input[type="submit"])
  const value = button.getAttribute('value');
  if (value) return value.trim();

  // Check inner text
  const text = button.textContent?.trim();
  if (text) return text;

  // Check aria-label
  const ariaLabel = button.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel.trim();

  return undefined;
}

/**
 * Detect the type of form based on fields and context
 */
export function detectFormType(fields: FormField[], form: Element): PageForm['formType'] {
  const fieldNames = fields.map((f) => f.name.toLowerCase());
  const fieldTypes = fields.map((f) => f.type);

  // Check for specific field combinations
  const hasEmail = fieldTypes.includes('email') || fieldNames.some((n) => n.includes('email'));
  const hasPassword = fieldTypes.includes('password') || fieldNames.some((n) => n.includes('password'));
  const hasPhone = fieldTypes.includes('tel') || fieldNames.some((n) => n.includes('phone') || n.includes('tel'));
  const hasMessage =
    fieldTypes.includes('textarea') || fieldNames.some((n) => n.includes('message') || n.includes('comment'));
  const hasName = fieldNames.some((n) => n.includes('name'));
  const hasSearch = fieldTypes.includes('search') || fieldNames.some((n) => n.includes('search') || n.includes('query'));

  // Check form attributes
  const action = form.getAttribute('action')?.toLowerCase() || '';
  const formClass = form.getAttribute('class')?.toLowerCase() || '';
  const formId = form.getAttribute('id')?.toLowerCase() || '';

  // Login form: email/username + password, no other fields
  if (hasPassword && (hasEmail || fieldNames.some((n) => n.includes('username'))) && fields.length <= 4) {
    return 'login';
  }

  // Signup form: password + confirm password or more fields than login
  if (hasPassword && fields.length > 3) {
    return 'signup';
  }

  // Search form
  if (hasSearch || action.includes('search') || formClass.includes('search') || formId.includes('search')) {
    return 'search';
  }

  // Newsletter form: just email (possibly name)
  if (hasEmail && !hasMessage && !hasPhone && fields.length <= 2) {
    return 'newsletter';
  }

  // Booking form
  if (
    fieldNames.some((n) => n.includes('date') || n.includes('time') || n.includes('booking') || n.includes('appointment'))
  ) {
    return 'booking';
  }

  // Quote form
  if (
    fieldNames.some((n) => n.includes('quote') || n.includes('estimate') || n.includes('budget') || n.includes('project'))
  ) {
    return 'quote';
  }

  // Contact form: name + email + message (common pattern)
  if ((hasName || hasEmail) && hasMessage) {
    return 'contact';
  }

  // Default to contact if it has typical contact fields
  if (hasEmail || hasPhone || hasMessage) {
    return 'contact';
  }

  return 'other';
}
