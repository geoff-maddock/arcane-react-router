import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { handleFormError } from '@/lib/errorHandler';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSlug } from '@/hooks/useSlug';
import { useFormValidation } from '@/hooks/useFormValidation';
import { tagEditSchema } from '@/validation/schemas';
import ValidationSummary from '@/components/ValidationSummary';
import { useSearchOptions } from '@/hooks/useSearchOptions';
import { SITE_NAME, DEFAULT_IMAGE } from '@/lib/seo';
import { CheckCircle, XCircle } from 'lucide-react';
import type { Tag } from '@/types/api';

export function meta() {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://arcane.city/tags/edit';
    return [
        { title: `Edit Tag • ${SITE_NAME}` },
        { property: 'og:url', content: `${url}` },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: `Edit Tag • ${SITE_NAME}` },
        { property: 'og:image', content: DEFAULT_IMAGE },
        { property: 'og:description', content: `Edit a tag in the Pittsburgh Events Guide.` },
        { name: 'description', content: `Edit a tag in the Pittsburgh Events Guide.` },
    ];
}

export default function TagEdit() {
    const navigate = useNavigate();
    const { slug: tagSlug } = useParams();
    const queryClient = useQueryClient();

    const { data: tag, isLoading: tagLoading } = useQuery<Tag>({
        queryKey: ['tag', tagSlug],
        queryFn: async () => {
            if (!tagSlug) throw new Error('Tag slug is required');
            const { data } = await api.get<Tag>(`/tags/${tagSlug}`);
            return data;
        },
        enabled: !!tagSlug,
    });

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        tag_type_id: '' as number | '',
    });

    const { name, slug, setName, setSlug, initialize } = useSlug('', '');
    const { setValues: setInternalValues, setFieldValue, handleChange: baseHandleChange, handleBlur, errors, touched, validateForm, getFieldError, errorSummary, generalError, setGeneralError, applyExternalErrors } = useFormValidation({
        initialValues: formData,
        schema: tagEditSchema,
        buildValidationValues: (vals) => ({
            name: name,
            slug: slug,
            description: vals.description,
            tag_type_id: vals.tag_type_id,
        })
    });

    const [nameCheck, setNameCheck] = useState<'idle' | 'unique' | 'duplicate'>('idle');
    const [duplicateTag, setDuplicateTag] = useState<{ name: string; slug: string } | null>(null);

    // Shared field classes for dark mode consistency
    const fieldClasses = 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 focus-visible:ring-0 focus:border-slate-500 focus:dark:border-slate-400';

    useEffect(() => {
        if (tag) {
            const newValues = {
                name: tag.name,
                slug: tag.slug,
                description: tag.description || '',
                tag_type_id: (tag.tag_type_id || tag.tag_type?.id || '') as number | '',
            };
            setFormData(newValues);
            setInternalValues(newValues);
            initialize(tag.name, tag.slug);
        }
    }, [tag, initialize, setInternalValues]);

    useEffect(() => {
        const trimmedName = name.trim();
        const trimmedSlug = slug.trim();
        if (!trimmedName || !trimmedSlug) {
            setNameCheck('idle');
            setDuplicateTag(null);
            return;
        }
        // Skip if unchanged from original tag values (treat as unique)
        if (tag && trimmedName === tag.name && trimmedSlug === tag.slug) {
            setNameCheck('idle');
            setDuplicateTag(null);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const params = new URLSearchParams();
                params.append('filters[name]', trimmedName);
                params.append('filters[slug]', trimmedSlug);
                params.append('limit', '1');
                const { data } = await api.get(`/tags?${params.toString()}`, { signal: controller.signal });
                if (data?.data?.length > 0) {
                    const t = data.data[0];
                    // If the found tag is the same as the one we're editing, treat as unique
                    if (tag && t.slug === tag.slug) {
                        setDuplicateTag(null);
                        setNameCheck('idle');
                    } else {
                        setDuplicateTag({ name: t.name, slug: t.slug });
                        setNameCheck('duplicate');
                    }
                } else {
                    setDuplicateTag(null);
                    setNameCheck('unique');
                }
            } catch {
                /* ignore */
            }
        }, 400);
        return () => { controller.abort(); clearTimeout(timer); };
    }, [name, slug, tag]);

    const { data: tagTypeOptions } = useSearchOptions('tag-types', '');

    type FormState = typeof formData;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        const fieldName = target.name;
        const value = target.value;
        setFormData(prev => ({ ...prev, [fieldName]: value }));
        baseHandleChange(e);
        if (fieldName === 'name') {
            setName(value);
            // Only auto-update slug if it hasn't been manually edited
            // But useSlug hook handles this logic via manuallyOverridden
        }
        if (fieldName === 'slug') setSlug(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError('');
        setInternalValues(v => ({ ...v }));
        if (!validateForm()) return;
        try {
            const payload = {
                ...formData,
                name,
                slug,
                tag_type_id: formData.tag_type_id || undefined,
            };
            const { data } = await api.patch(`/tags/${tagSlug}`, payload);
            await queryClient.invalidateQueries({ queryKey: ['tag', tagSlug] });
            navigate(`/tags/${data.slug}`);
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

    if (tagLoading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    if (!tag) {
        return <div className="p-8 text-center">Tag not found</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                    <Link to={`/tags/${tagSlug}`}>Back</Link>
                </Button>
            </div>
            <h1 className="text-3xl font-bold">Edit Tag</h1>
            {generalError && (
                <div className="text-red-500">{generalError}</div>
            )}
            <ValidationSummary errorSummary={errorSummary} />
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <div className="flex items-center gap-2">
                        <Input id="name" name="name" value={name} onChange={handleChange} onBlur={handleBlur} className={fieldClasses} />
                        {nameCheck === 'unique' && <CheckCircle className="text-green-500" size={20} />}
                        {nameCheck === 'duplicate' && <XCircle className="text-red-500" size={20} />}
                    </div>
                    {nameCheck === 'unique' && <p className="text-green-600 text-xs">Unique</p>}
                    {nameCheck === 'duplicate' && duplicateTag && (
                        <p className="text-red-600 text-xs">Duplicate tag exists: <Link to={`/tags/${duplicateTag.slug}`} className="underline">{duplicateTag.name}</Link></p>
                    )}
                    {renderError('name')}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input id="slug" name="slug" value={slug} onChange={handleChange} onBlur={handleBlur} className={fieldClasses} />
                    {nameCheck === 'unique' && <p className="text-green-600 text-xs">Unique</p>}
                    {nameCheck === 'duplicate' && duplicateTag && <p className="text-red-600 text-xs">Slug in use</p>}
                    {renderError('slug')}
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
                <div className="space-y-2">
                    <Label>Tag Type</Label>
                    <Select
                        value={formData.tag_type_id ? String(formData.tag_type_id) : ''}
                        onValueChange={v => {
                            const val = Number(v);
                            setFormData(p => ({ ...p, tag_type_id: val }));
                            setFieldValue('tag_type_id', val);
                        }}
                    >
                        <SelectTrigger className={fieldClasses}>
                            <SelectValue placeholder="Select a tag type" />
                        </SelectTrigger>
                        <SelectContent>
                            {tagTypeOptions?.map(opt => (
                                <SelectItem key={opt.id} value={String(opt.id)}>
                                    {opt.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {renderError('tag_type_id')}
                </div>
                <Button type="submit" className="w-full">Update Tag</Button>
            </form>
        </div>
    );
}
