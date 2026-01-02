import { useState, useEffect } from 'react';
import { DescriptionSection } from './DescriptionSection';
import { useToast } from '@/components/ui/Toast';
import { useOKRStore } from '@/store/useOKRStore';
import { supabase } from '@/lib/supabase';

export function CompanyDescriptionTab() {
    const { addToast } = useToast();
    const { organizationId } = useOKRStore();

    // State for the three sections
    const [orgDesc, setOrgDesc] = useState('');
    const [productDesc, setProductDesc] = useState('');
    const [missionDesc, setMissionDesc] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (organizationId) {
            fetchDescriptions();
        }
    }, [organizationId]);

    const fetchDescriptions = async () => {
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('organization_description, product_description, mission_vision')
                .eq('id', organizationId)
                .single();

            if (error) throw error;

            if (data) {
                setOrgDesc(data.organization_description || '');
                setProductDesc(data.product_description || '');
                setMissionDesc(data.mission_vision || '');

                // If fields are empty, set defaults (only if truly empty/null to avoid overwriting user clearing it)
                if (data.organization_description === null) {
                    setOrgDesc(`OKR Blueprint is a software company dedicated to empowering ambitious teams by bridging the critical gap between strategic vision and successful execution. Through its intelligent, AI-powered platform, the organization provides the clarity, alignment, and accountability modern teams need to ensure their most important goals are achieved, transforming vision into reality and enabling the realization of ambitious outcomes.`);
                }
                if (data.product_description === null) {
                    setProductDesc(`OKR Focus is an AI-powered strategy execution platform designed to replace chaotic spreadsheets with a single source of truth, connecting your company vision to daily tasks for ambitious teams. Leverage advanced AI to instantly generate well-structured Objectives and Key Results, while integrated scheduling and capacity planning tools ensure achievable roadmaps and prevent team burnout. Ultimately, OKR Focus provides the critical insights and alignment needed to accelerate your goals and drive meaningful, confident results.`);
                }
                if (data.mission_vision === null) {
                    setMissionDesc(`Our mission is to empower ambitious teams to transform strategic vision into reality through intelligent clarity, alignment, and accountability, ensuring the confident achievement of their most ambitious goals.
---
Our vision is a world where every ambitious organization effortlessly aligns strategy with execution, consistently achieving its most audacious goals and unlocking its full potential.`);
                }
            }
        } catch (error: any) {
            console.error('Error fetching descriptions:', error);
            addToast({ type: 'error', title: 'Error loading data', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateMission = async () => {
        if (!orgDesc && !productDesc) {
            addToast({ type: 'error', title: 'Missing Input', message: 'Please fill in Organization or Product description first.' });
            return;
        }

        addToast({ type: 'info', title: 'Generating Strategy', message: 'Consulting AI...' });

        try {
            const { data, error } = await supabase.functions.invoke('generate-mission-vision', {
                body: { orgDesc, productDesc }
            });

            if (error) throw error;

            setMissionDesc(data.data);
            addToast({ type: 'success', title: 'Generated', message: 'Draft mission created.' });
        } catch (error: any) {
            console.error(error);
            addToast({ type: 'error', title: 'Generation Failed', message: error.message });
        }
    };

    const handleSave = async (section: string, fieldName: string, value: string) => {
        if (!organizationId) return;

        try {
            const updates: any = {};
            updates[fieldName] = value;

            const { error } = await supabase
                .from('organizations')
                .update(updates)
                .eq('id', organizationId);

            if (error) throw error;

            addToast({ type: 'success', title: 'Saved', message: `${section} has been updated.` });
        } catch (error: any) {
            console.error('Error saving description:', error);
            addToast({ type: 'error', title: 'Save failed', message: error.message });
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading descriptions...</div>
    }

    return (
        <div className="space-y-8 animate-in fade-in-50">
            <DescriptionSection
                title="Organization Description"
                description="Describe your organization: its history, culture, values, and what makes it unique."
                placeholder="Enter organization description..."
                value={orgDesc}
                onChange={setOrgDesc}
                // No AI for this section
                onGenerate={undefined}
                onSave={() => handleSave('Organization Description', 'organization_description', orgDesc)}
            />

            <DescriptionSection
                title="Product/Services Description"
                description="Describe what your organization sells or provides to its customers."
                placeholder="Enter product/services description..."
                value={productDesc}
                onChange={setProductDesc}
                // No AI for this section
                onGenerate={undefined}
                onSave={() => handleSave('Product/Services Description', 'product_description', productDesc)}
            />

            <DescriptionSection
                title="Mission & Vision"
                description="Define your core purpose (mission) and desired future (vision). The AI will use the descriptions above as context."
                placeholder="Enter mission and vision..."
                value={missionDesc}
                onChange={setMissionDesc}
                onGenerate={handleGenerateMission}
                onSave={() => handleSave('Mission & Vision', 'mission_vision', missionDesc)}
            />
        </div>
    );
}
