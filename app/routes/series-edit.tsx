import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { handleFormError } from '@/lib/errorHandler';
import { utcToLocalDatetimeInput } from '@/lib/utils';
import { useSearchOptions } from '../hooks/useSearchOptions';
import type { Series } from '../types/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSlug } from '@/hooks/useSlug';
import { seriesEditSchema } from '@/validation/schemas';
import ValidationSummary from '@/components/ValidationSummary';
import { useFormValidation } from '@/hooks/useFormValidation';
import AjaxMultiSelect from '@/components/AjaxMultiSelect';
import AjaxSelect from '@/components/AjaxSelect';
import { SITE_NAME, DEFAULT_IMAGE } from './../lib/seo';

export function meta() {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://arcane.city/series/edit';
    return [
        { title: `Edit Series • ${SITE_NAME}` },
        { property: 'og:url', content: `${url}` },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: `Edit Series • ${SITE_NAME}` },
        { property: 'og:image', content: DEFAULT_IMAGE },
        { property: 'og:description', content: `Edit a series in the Pittsburgh Events Guide.` },
        { name: 'description', content: `Edit a series in the Pittsburgh Events Guide.` },
    ];
}

export default function SeriesEdit() {
    const navigate = useNavigate();
    const { slug: seriesSlug } = useParams();
    const queryClient = useQueryClient();

    const { data: series } = useQuery<Series | null>({
        queryKey: ['series', seriesSlug],
        queryFn: async () => {
            if (!seriesSlug) return null;
            const { data } = await api.get<Series>(`/series/${seriesSlug}`);
            return data;
        },
        enabled: !!seriesSlug,
    });

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        short: '',
        visibility_id: 1,
        description: '',
        event_type_id: '' as number | '',
        promoter_id: '' as number | '',
        venue_id: '' as number | '',
        is_benefit: false,
        presale_price: '',
        door_price: '',
        start_at: '',
        end_at: '',
        founded_at: '',
        min_age: '',
        primary_link: '',
        ticket_link: '',
        tag_list: [] as number[],
        entity_list: [] as number[],
        occurrence_type_id: '' as number | '',
        occurrence_week_id: '' as number | '',
        occurrence_day_id: '' as number | '',
    });

    const { name, slug, setName, setSlug, manuallyOverridden, initialize } = useSlug('', '');

    const { data: visibilityOptions } = useSearchOptions('visibilities', '');
    const { data: occurrenceTypeOptions } = useSearchOptions('occurrence-types', '', {}, { sort: 'id', direction: 'asc' });
    const { data: occurrenceWeekOptions } = useSearchOptions('occurrence-weeks', '', {}, { sort: 'id', direction: 'asc' });
    const { data: occurrenceDayOptions } = useSearchOptions('occurrence-days', '', {}, { sort: 'id', direction: 'asc' });

    const { setValues: setFormValuesInternal, handleChange: baseHandleChange, handleBlur, errors, touched, validateForm, getFieldError, errorSummary, generalError, setGeneralError, applyExternalErrors } = useFormValidation({
        initialValues: formData,
        schema: seriesEditSchema,
        buildValidationValues: (vals) => ({
            name: name,
            slug: slug,
            short: vals.short,
            description: vals.description,
            presale_price: vals.presale_price,
            door_price: vals.door_price,
            start_at: vals.start_at,
            end_at: vals.end_at,
            founded_at: vals.founded_at,
            primary_link: vals.primary_link,
            ticket_link: vals.ticket_link,
        })
    });

    const fieldClasses = "bg-white border-slate-300 text-slate-900 placeholder-slate-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 focus-visible:ring-0 focus:border-slate-500 focus:dark:border-slate-400";

    useEffect(() => {
        if (series) {
            const populated: typeof formData = {
                name: series.name || '',
                slug: series.slug || '',
                short: series.short || '',
                visibility_id: (series.visibility?.id) || 1,
                description: series.description || '',
                event_type_id: (series.event_type?.id ?? '') as number | '',
                promoter_id: (series.promoter?.id ?? '') as number | '',
                venue_id: (series.venue?.id ?? '') as number | '',
                is_benefit: series.is_benefit || false,
                presale_price: series.presale_price ? String(series.presale_price) : '',
                door_price: series.door_price ? String(series.door_price) : '',
                start_at: utcToLocalDatetimeInput(series.start_at, { fixESTUtcBug: true }),
                end_at: utcToLocalDatetimeInput(series.end_at, { fixESTUtcBug: true }),
                founded_at: utcToLocalDatetimeInput(series.founded_at, { fixESTUtcBug: true }),
                min_age: series.min_age ? String(series.min_age) : '',
                primary_link: series.primary_link || '',
                ticket_link: series.ticket_link || '',
                tag_list: series.tags?.map(t => t.id) || [],
                entity_list: series.entities?.map(e => e.id) || [],
                occurrence_type_id: (series.occurrence_type?.id ?? '') as number | '',
                occurrence_week_id: (series.occurrence_week?.id ?? '') as number | '',
                occurrence_day_id: (series.occurrence_day?.id ?? '') as number | '',
            };
            setFormData(populated);
            setFormValuesInternal(populated);
            initialize(series.name || '', series.slug || '');
        }
    }, [series, initialize, setFormValuesInternal]);

    useEffect(() => {
        if (visibilityOptions && visibilityOptions.length > 0 && formData.visibility_id === 1) {
            const publicOption = visibilityOptions.find(option => option.name.toLowerCase() === 'public');
            if (publicOption) {
                setFormData(prev => ({ ...prev, visibility_id: publicOption.id }));
            }
        }
    }, [visibilityOptions, formData.visibility_id]);

    type FormState = typeof formData;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        const fieldName = target.name;
        const value = (target as HTMLInputElement).type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
        setFormData(prev => ({ ...prev, [fieldName]: value }));
        baseHandleChange(e);
        if (fieldName === 'name') {
            setName(String(value));
            if (!manuallyOverridden) queueMicrotask(() => setFormData(p => ({ ...p, slug })));
        }
        if (fieldName === 'slug') setSlug(String(value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError('');
        setFormValuesInternal(v => ({ ...v }));
        const ok = validateForm();
        if (!ok) return;
        try {
            const payload = {
                ...formData,
                presale_price: formData.presale_price ? parseFloat(formData.presale_price) : undefined,
                door_price: formData.door_price ? parseFloat(formData.door_price) : undefined,
                event_type_id: formData.event_type_id ? Number(formData.event_type_id) : undefined,
                promoter_id: formData.promoter_id ? Number(formData.promoter_id) : undefined,
                venue_id: formData.venue_id ? Number(formData.venue_id) : undefined,
                occurrence_type_id: formData.occurrence_type_id ? Number(formData.occurrence_type_id) : undefined,
                occurrence_week_id: formData.occurrence_week_id ? Number(formData.occurrence_week_id) : undefined,
                occurrence_day_id: formData.occurrence_day_id ? Number(formData.occurrence_day_id) : undefined,
                min_age: formData.min_age ? Number(formData.min_age) : undefined,
                tag_list: formData.tag_list,
                entity_list: formData.entity_list,
                start_at: formData.start_at ? `${formData.start_at}:00` : undefined,
                end_at: formData.end_at ? `${formData.end_at}:00` : undefined,
                founded_at: formData.founded_at ? `${formData.founded_at}:00` : undefined,
            };
            const { data } = await api.put(`/series/${seriesSlug}`, payload);
            await queryClient.invalidateQueries({ queryKey: ['series', data.slug] });
            navigate(`/series/${data.slug}`);
        } catch (err) {
            handleFormError(err, applyExternalErrors, setGeneralError);
        }
    };

    const renderError = (field: string) => {
        if (!touched[field] && !(errors[field] && errors[field].length)) return null;
        const message = getFieldError(field as keyof FormState);
        if (message) return <div className="text-red-500 text-sm">{message}</div>;
        return null;
    };

    if (!series && seriesSlug) {
        return <div className="p-8 text-center">Loading series...</div>;
    }

    return (
        <div className="max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto p-4 space-y-4">
            <h1 className="text-3xl font-bold">Edit Series</h1>
            {generalError && <div className="text-red-500">{generalError}</div>}
            <ValidationSummary errorSummary={errorSummary} />
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" value={name} onChange={handleChange} onBlur={handleBlur} className={fieldClasses} />
                        {renderError('name')}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input id="slug" name="slug" value={slug} onChange={handleChange} onBlur={handleBlur} className={fieldClasses} />
                        {renderError('slug')}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="short">Short Description</Label>
                    <textarea
                        id="short"
                        name="short"
                        className="w-full border rounded p-2 bg-white border-slate-300 text-slate-900 placeholder-slate-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 focus-visible:ring-0 focus:border-slate-500 focus:dark:border-slate-400"
                        value={formData.short}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />
                    {renderError('short')}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                        id="description"
                        name="description"
                        rows={6}
                        className="w-full border rounded p-2 bg-white border-slate-300 text-slate-900 placeholder-slate-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 focus-visible:ring-0 focus:border-slate-500 focus:dark:border-slate-400"
                        value={formData.description}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />
                    {renderError('description')}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="visibility_id">Visibility</Label>
                        <Select value={String(formData.visibility_id)} onValueChange={(val) => setFormData((p) => ({ ...p, visibility_id: Number(val) }))}>
                            <SelectTrigger id="visibility_id" className={fieldClasses}>
                                <SelectValue>{visibilityOptions?.find(o => o.id === Number(formData.visibility_id))?.name}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {visibilityOptions?.map((option) => (
                                    <SelectItem key={option.id} value={String(option.id)}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {renderError('visibility_id')}
                    </div>
                    <AjaxSelect
                        label="Event Type"
                        endpoint="event-types"
                        value={formData.event_type_id}
                        onChange={(val) => {
                            setFormData((p) => ({ ...p, event_type_id: val }));
                            setFormValuesInternal((p: typeof formData) => ({ ...p, event_type_id: val }));
                        }}
                        placeholder="Type to search event types..."
                        clientSideFiltering={true}
                    />
                    {renderError('event_type_id')}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AjaxSelect
                        label="Promoter"
                        endpoint="entities"
                        extraParams={{ 'filters[role]': 'Promoter' }}
                        value={formData.promoter_id}
                        onChange={(val) => setFormData((p) => ({ ...p, promoter_id: val }))}
                        placeholder="Type to search promoters..."
                    />
                    {renderError('promoter_id')}
                    <AjaxSelect
                        label="Venue"
                        endpoint="entities"
                        extraParams={{ 'filters[role]': 'Venue' }}
                        value={formData.venue_id}
                        onChange={(val) => setFormData((p) => ({ ...p, venue_id: val }))}
                        placeholder="Type to search venues..."
                    />
                    {renderError('venue_id')}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="occurrence_type_id">Occurrence Type</Label>
                        <Select value={String(formData.occurrence_type_id)} onValueChange={(val) => setFormData((p) => ({ ...p, occurrence_type_id: Number(val) }))}>
                            <SelectTrigger id="occurrence_type_id" className={fieldClasses}>
                                <SelectValue>{occurrenceTypeOptions?.find(o => o.id === Number(formData.occurrence_type_id))?.name}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {occurrenceTypeOptions?.map((option) => (
                                    <SelectItem key={option.id} value={String(option.id)}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="occurrence_week_id">Occurrence Week</Label>
                        <Select value={String(formData.occurrence_week_id)} onValueChange={(val) => setFormData((p) => ({ ...p, occurrence_week_id: Number(val) }))}>
                            <SelectTrigger id="occurrence_week_id" className={fieldClasses}>
                                <SelectValue>{occurrenceWeekOptions?.find(o => o.id === Number(formData.occurrence_week_id))?.name}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {occurrenceWeekOptions?.map((option) => (
                                    <SelectItem key={option.id} value={String(option.id)}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="occurrence_day_id">Occurrence Day</Label>
                        <Select value={String(formData.occurrence_day_id)} onValueChange={(val) => setFormData((p) => ({ ...p, occurrence_day_id: Number(val) }))}>
                            <SelectTrigger id="occurrence_day_id" className={fieldClasses}>
                                <SelectValue>{occurrenceDayOptions?.find(o => o.id === Number(formData.occurrence_day_id))?.name}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {occurrenceDayOptions?.map((option) => (
                                    <SelectItem key={option.id} value={String(option.id)}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="start_at">Start Time</Label>
                        <Input type="datetime-local" id="start_at" name="start_at" value={formData.start_at} onChange={handleChange} onBlur={handleBlur} className={fieldClasses} />
                        {renderError('start_at')}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="end_at">End Time</Label>
                        <Input type="datetime-local" id="end_at" name="end_at" value={formData.end_at} onChange={handleChange} onBlur={handleBlur} className={fieldClasses} />
                        {renderError('end_at')}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="founded_at">Founded At</Label>
                        <Input type="datetime-local" id="founded_at" name="founded_at" value={formData.founded_at} onChange={handleChange} onBlur={handleBlur} className={fieldClasses} />
                        {renderError('founded_at')}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="presale_price">Presale Price</Label>
                        <Input type="number" id="presale_price" name="presale_price" value={formData.presale_price} onChange={handleChange} onBlur={handleBlur} className={fieldClasses} />
                        {renderError('presale_price')}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="door_price">Door Price</Label>
                        <Input type="number" id="door_price" name="door_price" value={formData.door_price} onChange={handleChange} onBlur={handleBlur} className={fieldClasses} />
                        {renderError('door_price')}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="min_age">Min Age</Label>
                        <Input type="number" id="min_age" name="min_age" value={formData.min_age} onChange={handleChange} onBlur={handleBlur} className={fieldClasses} />
                        {renderError('min_age')}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="primary_link">Primary Link</Label>
                        <Input id="primary_link" name="primary_link" value={formData.primary_link} onChange={handleChange} onBlur={handleBlur} className={fieldClasses} />
                        {renderError('primary_link')}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ticket_link">Ticket Link</Label>
                        <Input id="ticket_link" name="ticket_link" value={formData.ticket_link} onChange={handleChange} onBlur={handleBlur} className={fieldClasses} />
                        {renderError('ticket_link')}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="is_benefit"
                            name="is_benefit"
                            checked={formData.is_benefit}
                            onChange={handleChange}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <Label htmlFor="is_benefit">Is Benefit?</Label>
                    </div>
                </div>
                <div className="space-y-2">
                    <AjaxMultiSelect
                        label="Tags"
                        endpoint="tags"
                        value={formData.tag_list}
                        onChange={(val) => setFormData((p) => ({ ...p, tag_list: val }))}
                        placeholder="Search tags..."
                    />
                </div>
                <div className="space-y-2">
                    <AjaxMultiSelect
                        label="Related Entities"
                        endpoint="entities"
                        value={formData.entity_list}
                        onChange={(val) => setFormData((p) => ({ ...p, entity_list: val }))}
                        placeholder="Search entities..."
                    />
                </div>
                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => navigate(`/series/${seriesSlug}`)}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </div>
            </form>
        </div>
    );
}
