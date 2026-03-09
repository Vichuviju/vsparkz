<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Seeder;

class PageSeeder extends Seeder
{
    /**
     * Create default published pages for the public website (home, about, services, etc.).
     */
    public function run(): void
    {
        $pages = [
            ['slug' => 'home', 'title' => 'Home', 'meta_title' => 'Vsparkz Digital | Digital Marketing Agency', 'meta_description' => 'Vsparkz Digital – Your digital marketing partner.', 'is_published' => true],
            ['slug' => 'about', 'title' => 'About Us', 'meta_title' => 'About | Vsparkz Digital', 'meta_description' => 'Learn about Vsparkz Digital.', 'is_published' => true],
            ['slug' => 'services', 'title' => 'Services', 'meta_title' => 'Services | Vsparkz Digital', 'meta_description' => 'Our digital marketing services.', 'is_published' => true],
            ['slug' => 'influencer-marketing', 'title' => 'Influencer Marketing', 'meta_title' => 'Influencer Marketing | Vsparkz Digital', 'meta_description' => 'Influencer marketing solutions.', 'is_published' => true],
            ['slug' => 'case-studies', 'title' => 'Case Studies', 'meta_title' => 'Case Studies | Vsparkz Digital', 'meta_description' => 'Our work and case studies.', 'is_published' => true],
            ['slug' => 'clients', 'title' => 'Clients', 'meta_title' => 'Clients | Vsparkz Digital', 'meta_description' => 'Our clients and partners.', 'is_published' => true],
        ];

        foreach ($pages as $data) {
            Page::updateOrCreate(
                ['slug' => $data['slug']],
                array_merge($data, ['content' => null, 'meta_keywords' => null, 'og_image' => null])
            );
        }
    }
}
