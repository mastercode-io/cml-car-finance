import { CheckboxField } from '../components/fields/CheckboxField';
import { DateField } from '../components/fields/DateField';
import { FileUploadField } from '../components/fields/FileUploadField';
import { NumberField } from '../components/fields/NumberField';
import { SelectField } from '../components/fields/SelectField';
import { TextAreaField } from '../components/fields/TextAreaField';
import { TextField } from '../components/fields/TextField';
import { RadioGroupField } from '../components/fields/RadioGroupField';
import { RatingField } from '../components/fields/RatingField';
import { SliderField } from '../components/fields/SliderField';
import { RepeaterField } from '../components/fields/RepeaterField';
import { CurrencyField } from '../components/fields/specialized/CurrencyField';
import { EmailField } from '../components/fields/specialized/EmailField';
import { PhoneField } from '../components/fields/specialized/PhoneField';
import { PostcodeField } from '../components/fields/specialized/PostcodeField';
export class FieldRegistry {
    static instance = null;
    fields = new Map();
    static getInstance() {
        if (!FieldRegistry.instance) {
            FieldRegistry.instance = new FieldRegistry();
        }
        return FieldRegistry.instance;
    }
    static reset() {
        if (!FieldRegistry.instance) {
            return;
        }
        FieldRegistry.instance.fields.clear();
        FieldRegistry.instance = null;
    }
    register(type, field) {
        if (this.fields.has(type)) {
            console.warn(`Field type ${type} is being overridden`);
        }
        this.fields.set(type, field);
    }
    get(type) {
        return this.fields.get(type);
    }
    getComponent(type) {
        const field = this.get(type);
        if (!field) {
            throw new Error(`Unknown field type: ${type}`);
        }
        return field.component;
    }
    list() {
        return Array.from(this.fields.keys());
    }
}
export function initializeFieldRegistry() {
    const registry = FieldRegistry.getInstance();
    if (registry.list().length === 0) {
        const defaultRegistrations = [
            ['Text', { component: TextField }],
            ['Number', { component: NumberField }],
            ['TextArea', { component: TextAreaField }],
            ['Select', { component: SelectField }],
            ['Checkbox', { component: CheckboxField }],
            ['Date', { component: DateField }],
            ['RadioGroup', { component: RadioGroupField }],
            ['Repeater', { component: RepeaterField }],
            ['FileUpload', { component: FileUploadField }],
            ['Slider', { component: SliderField }],
            ['Rating', { component: RatingField }],
            ['Currency', { component: CurrencyField }],
            ['Phone', { component: PhoneField }],
            ['Postcode', { component: PostcodeField }],
            ['Email', { component: EmailField }],
        ];
        defaultRegistrations.forEach(([type, component]) => {
            registry.register(type, component);
        });
    }
    return registry;
}
//# sourceMappingURL=field-registry.js.map