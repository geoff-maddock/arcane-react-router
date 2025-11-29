import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AjaxSelect from '@/components/AjaxSelect';
import AjaxMultiSelect from '@/components/AjaxMultiSelect';
import { api } from '@/lib/api';
import { handleFormError } from '@/lib/errorHandler';
import { useSlug } from '@/hooks/useSlug';
import { useSearchOptions } from '@/hooks/useSearchOptions';
import { CheckCircle, XCircle } from 'lucide-react';
import { SITE_NAME, DEFAULT_IMAGE } from '@/lib/seo';
import { useFormValidation } from '@/hooks/useFormValidation';
import { entityCreateSchema } from '@/validation/schemas';
import ValidationSummary from '@/components/ValidationSummary';

export function meta() {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://arcane.city/entity/create';
    return [
        { title: `Create Entity • ${SITE_NAME}` },
        { property: 'og:url', content: `${url}` },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: `Create Entity • ${SITE_NAME}` },
        { property: 'og:image', content: DEFAULT_IMAGE },
        { property: 'og:description', content: `Create a new entity in the Pittsburgh Events Guide.` },
        { name: 'description', content: `Create a new entity in the Pittsburgh Events Guide.` },
    ];
}

export default function EntityCreate() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        short: '',
        visibility_id: 1,
        description: '',
        entity_type_id: '' as number | '',
        entity_status_id: 1,
        started_at: '',
        facebook_username: '',
        instagram_username: '',
        primary_location_id: '' as number | '',
        tag_list: [] as number[],
        role_list: [] as number[],
    });
    const { name, slug, setName, setSlug, manuallyOverridden } = useSlug('', '');

    const { data: visibilityOptions } = useSearchOptions('visibilities', '');
    const { data: entityStatusOptions } = useSearchOptions('entity-statuses', '');

    const { setValues: setInternalValues, setFieldValue, handleChange: baseHandleChange, handleBlur, errors, touched, validateForm, getFieldError, errorSummary, generalError, setGeneralError, applyExternalErrors } = useFormValidation({
        initialValues: formData,
        schema: entityCreateSchema,
        buildValidationValues: (vals) => ({
            ...vals,
            name: name,
            slug: slug,
        })
    });

    const [nameCheck, setNameCheck] = useState<'idle' | 'unique' | 'duplicate'>('idle');
    const [duplicateEntity, setDuplicateEntity] = useState<{ name: string; slug: string } | null>(null);

    // Shared form field classes (light + dark) for consistent contrast
    const fieldClasses = "bg-white border-slate-300 text-slate-900 placeholder-slate-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 focus-visible:ring-0 focus:border-slate-500 focus:dark:border-slate-400";

    // Set default visibility to "Public" when options are loaded
    useEffect(() => {
        if (visibilityOptions && visibilityOptions.length > 0) {
            const publicOption = visibilityOptions.find(option => option.name.toLowerCase() === 'public');
            if (publicOption && formData.visibility_id === 1) {
                setFormData(prev => ({ ...prev, visibility_id: publicOption.id }));
            }
        }
    }, [visibilityOptions, formData.visibility_id]);

    // Set default entity status to "Active" when options are loaded
    useEffect(() => {
        if (entityStatusOptions && entityStatusOptions.length > 0) {
            const activeOption = entityStatusOptions.find(option => option.name.toLowerCase() === 'active');
            if (activeOption && formData.entity_status_id === 1) {
                setFormData(prev => ({ ...prev, entity_status_id: activeOption.id }));
            }
        }
    }, [entityStatusOptions, formData.entity_status_id]);

    useEffect(() => {
        const trimmedName = name.trim();
        const trimmedSlug = slug.trim();
        if (!trimmedName || !trimmedSlug) {
            setNameCheck('idle');
            setDuplicateEntity(null);
            return;
        }
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const params = new URLSearchParams();
                params.append('filters[name]', trimmedName);
                params.append('filters[slug]', trimmedSlug);
                params.append('limit', '1');
                const { data } = await api.get(`/entities?${params.toString()}`, {
                    signal: controller.signal,
                });
                if (data?.data?.length > 0) {
                    const ent = data.data[0];
                    setDuplicateEntity({ name: ent.name, slug: ent.slug });
                    setNameCheck('duplicate');
                } else {
                    setDuplicateEntity(null);
                    setNameCheck('unique');
                }
            } catch {
                // ignore errors
            }
        }, 500);
        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [name, slug]);

    type FormState = typeof formData;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        const fieldName = target.name;
        const value = target.value;
        setFormData(prev => ({ ...prev, [fieldName]: value }));
        baseHandleChange(e);
        if (fieldName === 'name') {
            setName(value);
            if (!manuallyOverridden) queueMicrotask(() => setFormData(p => ({ ...p, slug })));
        }
        if (fieldName === 'slug') setSlug(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError('');
        setInternalValues(v => ({ ...v, name, slug }));
        if (!validateForm()) return;

        try {
            const payload = {
                ...formData,
                name,
                slug,
                entity_type_id: formData.entity_type_id || undefined,
                primary_location_id: formData.primary_location_id || undefined,
            };
            const { data } = await api.post('/entities', payload);
            navigate(`/entities/${data.slug}`);
        } catch (error) {
            handleFormError(
                error,
                applyExternalErrors,
                setGeneralError
            );
        }
    };

    const renderError = (field: string) => {
        if (!touched[field] && !(errors[field] && errors[field].length)) return null;
        const message = getFieldError(field as keyof FormState);
        if (message) return <p className="text-sm text-red-500 mt-1">{message}</p>;
        return null;
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                    <Link to="/entities">Back</Link>
                </Button>
            </div>
            <h1 className="text-3xl font-bold">Create Entity</h1>
            {generalError && (
                <div className="text-red-500">{generalError}</div>
            )}
            <ValidationSummary errorSummary={errorSummary} />
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <div className="flex items-center gap-2">
                            <Input id="name" name="name" value={name} onChange={handleChange} onBlur={handleBlur} className={fieldClasses} />
                            {nameCheck === 'unique' && <CheckCircle className="text-green-500" size={20} />}
                            {nameCheck === 'duplicate' && <XCircle className="text-red-500" size={20} />}
                        </div>
                        {nameCheck === 'unique' && <p className="text-green-600 text-xs">Unique</p>}
                        {nameCheck === 'duplicate' && duplicateEntity && (
                            <p className="text-red-600 text-xs">Duplicate entity exists: <Link to={`/entities/${duplicateEntity.slug}`} className="underline">{duplicateEntity.name}</Link></p>
                        )}
                        {renderError('name')}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input id="slug" name="slug" value={slug} onChange={handleChange} onBlur={handleBlur} className={fieldClasses} />
                        {nameCheck === 'unique' && <p className="text-green-600 text-xs">Unique</p>}
                        {nameCheck === 'duplicate' && duplicateEntity && <p className="text-red-600 text-xs">Slug in use</p>}
                        {renderError('slug')}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="short">Short Description</Label>
                    <Input id="short" name="short" value={formData.short} onChange={handleChange} onBlur={handleBlur} className={fieldClasses} />
                    {renderError('short')}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full border rounded p-2 bg-white border-slate-300 text-slate-900 placeholder-slate-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 focus-visible:ring-0 focus:border-slate-500 focus:dark:border-slate-400"
                        rows={4}
                    />
                    {renderError('description')}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="visibility_id">Visibility</Label>
                        <Select
                            value={formData.visibility_id.toString()}
                            onValueChange={(value) => {
                                const val = Number(value);
                                setFormData(prev => ({ ...prev, visibility_id: val }));
                                setFieldValue('visibility_id', val);
                            }}
                        >
                            <SelectTrigger className={fieldClasses}>
                                <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                            <SelectContent>
                                {visibilityOptions?.map((option) => (
                                    <SelectItem key={option.id} value={option.id.toString()}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {renderError('visibility_id')}
                    </div>
                    <div className="space-y-2">
                        <AjaxSelect
                            label="Entity Type"
                            endpoint="entity-types"
                            value={formData.entity_type_id}
                            onChange={(val) => {
                                setFormData((p) => ({ ...p, entity_type_id: val }));
                                setFieldValue('entity_type_id', val);
                            }}
                            placeholder="Type to search entity types..."
                        />
                        {renderError('entity_type_id')}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="entity_status_id">Entity Status</Label>
                        <Select
                            value={formData.entity_status_id.toString()}
                            onValueChange={(value) => {
                                const val = Number(value);
                                setFormData(prev => ({ ...prev, entity_status_id: val }));
                                setFieldValue('entity_status_id', val);
                            }}
                        >
                            <SelectTrigger className={fieldClasses}>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {entityStatusOptions?.map((option) => (
                                    <SelectItem key={option.id} value={option.id.toString()}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {renderError('entity_status_id')}
                    </div>
                    <div className="space-y-2">
                        <AjaxSelect
                            label="Primary Location"
                            endpoint="locations"
                            value={formData.primary_location_id}
                            onChange={(val) => {
                                setFormData((p) => ({ ...p, primary_location_id: val }));
                                setFieldValue('primary_location_id', val);
                            }}
                            placeholder="Type to search locations..."
                        />
                        {renderError('primary_location_id')}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="started_at">Started At</Label>
                        <Input
                            id="started_at"
                            name="started_at"
                            type="datetime-local"
                            value={formData.started_at}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={fieldClasses}
                        />
                        {renderError('started_at')}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="facebook_username">Facebook Username</Label>
                        <Input
                            id="facebook_username"
                            name="facebook_username"
                            value={formData.facebook_username}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="facebook_username"
                            className={fieldClasses}
                        />
                        {renderError('facebook_username')}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="instagram_username">Instagram Username</Label>
                        <Input
                            id="instagram_username"
                            name="instagram_username"
                            value={formData.instagram_username}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="instagram_username"
                            className={fieldClasses}
                        />
                        {renderError('instagram_username')}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AjaxMultiSelect
                        label="Tags"
                        endpoint="tags"
                        value={formData.tag_list}
                        onChange={(val) => {
                            setFormData((p) => ({ ...p, tag_list: val }));
                            setFieldValue('tag_list', val);
                        }}
                        placeholder="Search tags..."
                    />
                    <AjaxMultiSelect
                        label="Roles"
                        endpoint="roles"
                        value={formData.role_list}
                        onChange={(val) => {
                            setFormData((p) => ({ ...p, role_list: val }));
                            setFieldValue('role_list', val);
                        }}
                        placeholder="Search roles..."
                    />
                </div>
                <Button type="submit" className="w-full">Create Entity</Button>
            </form>
        </div>
    );
}
