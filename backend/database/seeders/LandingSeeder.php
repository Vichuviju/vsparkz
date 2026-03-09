<?php

namespace Database\Seeders;

use App\Models\LandingBlock;
use App\Models\LandingSection;
use App\Models\LandingTemplate;
use Illuminate\Database\Seeder;

class LandingSeeder extends Seeder
{
    private const SECTION_TYPES = [
        'hero',
        'logos',
        'services',
        'about',
        'metrics',
        'influencer_highlight',
        'testimonials',
        'case_studies',
        'cta',
        'footer_cta',
    ];

    public function run(): void
    {
        $templates = [
            [
                'name' => 'AI Agency',
                'slug' => LandingTemplate::SLUG_AI_AGENCY,
                'description' => 'Modern AI-focused agency style',
                'layout_style' => ['section_spacing' => 'py-20', 'typography_scale' => 'lg'],
                'animation_defaults' => ['type' => 'fade_up', 'duration' => 600, 'trigger' => 'on_scroll'],
                'is_active' => true,
                'sort_order' => 0,
            ],
            [
                'name' => 'Enterprise Marketing',
                'slug' => LandingTemplate::SLUG_ENTERPRISE,
                'description' => 'Enterprise-grade marketing template',
                'layout_style' => ['section_spacing' => 'py-24', 'typography_scale' => 'xl'],
                'animation_defaults' => ['type' => 'fade_in', 'duration' => 500, 'trigger' => 'on_scroll'],
                'is_active' => false,
                'sort_order' => 1,
            ],
            [
                'name' => 'Influencer Marketing',
                'slug' => LandingTemplate::SLUG_INFLUENCER,
                'description' => 'Influencer and creator-focused',
                'layout_style' => ['section_spacing' => 'py-16', 'typography_scale' => 'lg'],
                'animation_defaults' => ['type' => 'slide_up', 'duration' => 550, 'trigger' => 'on_scroll'],
                'is_active' => false,
                'sort_order' => 2,
            ],
            [
                'name' => 'Startup / SaaS',
                'slug' => LandingTemplate::SLUG_STARTUP,
                'description' => 'Startup and SaaS product style',
                'layout_style' => ['section_spacing' => 'py-20', 'typography_scale' => 'lg'],
                'animation_defaults' => ['type' => 'fade_up', 'duration' => 600, 'trigger' => 'on_load'],
                'is_active' => false,
                'sort_order' => 3,
            ],
        ];

        foreach ($templates as $index => $data) {
            $template = LandingTemplate::updateOrCreate(
                ['slug' => $data['slug']],
                $data
            );

            if ($template->wasRecentlyCreated || $template->sections()->count() === 0) {
                $this->seedSectionsForTemplate($template, $index === 0);
            }
        }

        // Ensure only one active
        LandingTemplate::where('slug', '!=', LandingTemplate::SLUG_AI_AGENCY)->update(['is_active' => false]);
        LandingTemplate::where('slug', LandingTemplate::SLUG_AI_AGENCY)->update(['is_active' => true]);
    }

    private function seedSectionsForTemplate(LandingTemplate $template, bool $fullContent): void
    {
        $sectionConfigs = [
            ['type' => 'hero', 'layout_variant' => 'centered', 'blocks' => [
                ['type' => 'headline', 'content' => ['text' => 'We scale brands using AI-powered marketing'], 'animation_config' => ['type' => 'fade_up', 'delay' => 0, 'duration' => 600, 'trigger' => 'on_load']],
                ['type' => 'subheadline', 'content' => ['text' => 'Data-driven strategies. Creative execution. Results that matter.'], 'animation_config' => ['type' => 'fade_up', 'delay' => 100, 'duration' => 600, 'trigger' => 'on_load']],
                ['type' => 'cta', 'content' => ['label' => 'Get started', 'url' => '/get-quote', 'secondary_label' => 'Learn more', 'secondary_url' => '/about'], 'animation_config' => ['type' => 'fade_up', 'delay' => 200, 'duration' => 600, 'trigger' => 'on_load']],
            ]],
            ['type' => 'logos', 'layout_variant' => 'default', 'blocks' => [
                ['type' => 'subheadline', 'content' => ['text' => 'Trusted by 120+ brands worldwide'], 'animation_config' => ['type' => 'fade_in', 'delay' => 0, 'duration' => 500, 'trigger' => 'on_scroll']],
                ['type' => 'logo_grid', 'content' => ['logos' => ['Brand One', 'Brand Two', 'Brand Three', 'Brand Four', 'Brand Five', 'Brand Six']], 'animation_config' => ['type' => 'stagger', 'delay' => 50, 'duration' => 400, 'trigger' => 'on_scroll']],
            ]],
            ['type' => 'services', 'layout_variant' => 'grid', 'blocks' => [
                ['type' => 'headline', 'content' => ['text' => 'What we do']],
                ['type' => 'subheadline', 'content' => ['text' => 'Full-funnel digital marketing services']],
                ['type' => 'paragraph', 'content' => ['text' => 'SEO, paid media, influencer campaigns, and content that converts.']],
            ]],
            ['type' => 'about', 'layout_variant' => 'left-image', 'blocks' => [
                ['type' => 'headline', 'content' => ['text' => 'About Vsparkz Digital']],
                ['type' => 'paragraph', 'content' => ['text' => 'We are a digital marketing agency that combines data, creativity, and technology to grow brands.']],
                ['type' => 'cta', 'content' => ['label' => 'Our story', 'url' => '/about']],
            ]],
            ['type' => 'metrics', 'layout_variant' => 'default', 'blocks' => [
                ['type' => 'counter', 'content' => ['value' => '120', 'suffix' => '+', 'label' => 'Brands scaled'], 'animation_config' => ['type' => 'counter', 'trigger' => 'on_scroll']],
                ['type' => 'counter', 'content' => ['value' => '50', 'suffix' => 'M+', 'label' => 'Reach delivered'], 'animation_config' => ['type' => 'counter', 'trigger' => 'on_scroll']],
                ['type' => 'counter', 'content' => ['value' => '98', 'suffix' => '%', 'label' => 'Client retention'], 'animation_config' => ['type' => 'counter', 'trigger' => 'on_scroll']],
            ]],
            ['type' => 'testimonials', 'layout_variant' => 'carousel', 'blocks' => [
                ['type' => 'headline', 'content' => ['text' => 'What clients say']],
                ['type' => 'paragraph', 'content' => ['text' => '"Vsparkz delivered 3x ROAS in the first quarter." — Marketing Director, Tech Co.']],
                ['type' => 'paragraph', 'content' => ['text' => '"Professional, data-driven, and creative. Highly recommend." — Founder, Startup XYZ']],
            ]],
            ['type' => 'cta', 'layout_variant' => 'centered', 'blocks' => [
                ['type' => 'headline', 'content' => ['text' => 'Ready to grow?']],
                ['type' => 'subheadline', 'content' => ['text' => 'Get a free strategy session.']],
                ['type' => 'cta', 'content' => ['label' => 'Get your quote', 'url' => '/get-quote']],
            ]],
            ['type' => 'footer_cta', 'layout_variant' => 'default', 'blocks' => [
                ['type' => 'paragraph', 'content' => ['text' => '© ' . date('Y') . ' Vsparkz Digital. All rights reserved.']],
                ['type' => 'cta', 'content' => ['label' => 'Contact', 'url' => '/contact']],
            ]],
        ];

        foreach ($sectionConfigs as $order => $config) {
            $section = LandingSection::create([
                'landing_template_id' => $template->id,
                'type' => $config['type'],
                'layout_variant' => $config['layout_variant'],
                'sort_order' => $order,
                'is_active' => true,
                'settings' => [],
            ]);

            foreach ($config['blocks'] as $blockOrder => $blockData) {
                LandingBlock::create([
                    'landing_section_id' => $section->id,
                    'type' => $blockData['type'],
                    'content' => $blockData['content'] ?? [],
                    'animation_config' => $blockData['animation_config'] ?? null,
                    'sort_order' => $blockOrder,
                ]);
            }
        }
    }
}
