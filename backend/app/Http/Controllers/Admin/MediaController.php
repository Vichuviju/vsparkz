<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    /** Return PHP upload limits used by this process (for diagnostics). */
    public function uploadLimits(): JsonResponse
    {
        return response()->json([
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
            'php_ini_loaded_file' => php_ini_loaded_file() ?: null,
            'hint' => 'Edit the php.ini above: set upload_max_filesize = 50M and post_max_size = 52M, then restart php artisan serve.',
        ]);
    }

    private function uploadDiagnostic(): array
    {
        return [
            'php_upload_max_filesize' => ini_get('upload_max_filesize'),
            'php_post_max_size' => ini_get('post_max_size'),
            'php_ini_loaded_file' => php_ini_loaded_file() ?: null,
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $query = Media::query()->orderByDesc('created_at');
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('filename', 'like', "%{$search}%")->orWhere('path', 'like', "%{$search}%");
            });
        }
        if ($request->filled('mime_type')) {
            $query->where('mime_type', 'like', $request->input('mime_type') . '%');
        }
        $perPage = (int) $request->input('per_page', 24);
        $media = $query->paginate(min($perPage, 100));
        $media->getCollection()->transform(function (Media $m) {
            $m->url = $m->url;
            return $m;
        });
        return response()->json($media);
    }

    /** Max upload size: 50MB for high-quality images. PHP must allow it (upload_max_filesize, post_max_size). */
    private const MAX_FILE_BYTES = 50 * 1024 * 1024;

    public function store(Request $request): JsonResponse
    {
        // Detect PHP upload errors before validation (e.g. file too large for PHP)
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            if (! $file->isValid()) {
                $code = (int) $file->getError();
                $msg = match ($code) {
                    UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'File too large for PHP. In WAMP: PHP → php.ini → set upload_max_filesize and post_max_size to 50M or higher, then restart Apache.',
                    UPLOAD_ERR_PARTIAL => 'Upload incomplete. Try again.',
                    UPLOAD_ERR_NO_FILE => 'No file was sent.',
                    default => 'Upload failed (code ' . $code . '). Try a smaller file or increase PHP upload limits.',
                };
                return response()->json([
                    'message' => $msg,
                    'errors' => ['file' => [$msg]],
                    'diagnostic' => $this->uploadDiagnostic(),
                ], 422);
            }
        }
        if (! $request->hasFile('file') && isset($_FILES['file']['error']) && $_FILES['file']['error'] !== UPLOAD_ERR_NO_FILE && $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            $code = (int) $_FILES['file']['error'];
            $msg = $code === UPLOAD_ERR_INI_SIZE || $code === UPLOAD_ERR_FORM_SIZE
                ? 'File too large. Set upload_max_filesize and post_max_size to 50M in php.ini, then restart php artisan serve.'
                : 'Upload failed (code ' . $code . ').';
            return response()->json([
                'message' => $msg,
                'errors' => ['file' => [$msg]],
                'diagnostic' => $this->uploadDiagnostic(),
            ], 422);
        }

        // No file received at all – usually means PHP rejected it (e.g. 3MB > default 2M)
        if (! $request->hasFile('file')) {
            $hint = 'No file received. PHP upload_max_filesize is likely 2M – your 3MB image is rejected. '
                . 'Edit the php.ini shown in diagnostic below, set upload_max_filesize = 50M and post_max_size = 52M, then restart php artisan serve.';
            return response()->json([
                'message' => $hint,
                'errors' => ['file' => [$hint]],
                'diagnostic' => $this->uploadDiagnostic(),
            ], 422);
        }

        $request->validate([
            'file' => 'required|file|max:'. self::MAX_FILE_BYTES,
        ], [
            'file.required' => 'Please select a file to upload.',
            'file.file' => 'The file failed to upload. Use a smaller file or ensure PHP allows uploads (upload_max_filesize, post_max_size in php.ini).',
            'file.max' => 'The file must not be larger than 50 MB.',
        ]);
        $file = $request->file('file');
        $path = $file->store('media/' . date('Y/m'), 'public');
        $media = Media::create([
            'path' => $path,
            'filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'disk' => 'public',
        ]);
        $media->url = $media->url;
        return response()->json($media, 201);
    }
}
