export interface BlogSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  category: string;
  readTime: string;
  coverGradient: string;
  tags: string[];
  sections: BlogSection[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'edit-photos-in-the-browser-without-uploading',
    title: 'How to edit photos in your browser without uploading them to a server',
    description:
      'Learn how Pixora keeps photo edits on your device, which tools to start with, and how non-destructive adjustments protect original files.',
    excerpt:
      'You do not need a cloud upload to crop, color-correct, or export a finished photo. Here is how a private browser studio works—and how to get a clean result fast.',
    publishedAt: '2026-11-12',
    updatedAt: '2026-11-12',
    author: 'Pixora Studio',
    category: 'Photo Editing',
    readTime: '7 min read',
    coverGradient: 'from-[#1A73E8] via-[#4285F4] to-[#8AB4F8]',
    tags: ['photo editor', 'privacy', 'browser tools'],
    sections: [
      {
        heading: 'Why local editing still matters',
        paragraphs: [
          'Most online editors send your original file to a remote server before you see a preview. That is convenient for collaboration, but it is a poor default for personal photos, client work, or anything you would not paste into a public chat.',
          'Pixora runs the photo editor, cinematic filters, collage maker, background remover, and compressor in your browser. Images stay in memory and in local IndexedDB on your device unless you choose to export them.',
        ],
      },
      {
        heading: 'A simple editing sequence that actually looks finished',
        paragraphs: [
          'Open the Photo Editor, drop a photo, and resist the urge to max out every slider. A reliable sequence is crop and straighten first, then exposure, then white balance, then local contrast, then a light amount of sharpening at the end.',
        ],
        bullets: [
          'Crop and straighten so the frame is already telling the story.',
          'Fix exposure and highlights before you add color.',
          'Balance temperature and tint so skin and neutrals feel natural.',
          'Add contrast or a cinematic grade only after the image is technically solid.',
          'Export PNG for graphics, JPEG for photos, or WebP when you need a smaller file.',
        ],
      },
      {
        heading: 'Keep a reversible copy of the work',
        paragraphs: [
          'Pixora stores projects locally so you can reopen an edit later. If auto-save is enabled in Settings, the current document is written back to IndexedDB as you work. That is useful when a browser tab reloads, but it is still not a substitute for exporting a finished master file to disk.',
          'When you are happy with the result, export once at full resolution, then optionally send the same image through the compressor if you need a web-sized version.',
        ],
      },
    ],
  },
  {
    slug: 'cinematic-color-grading-for-everyday-photos',
    title: 'Cinematic color grading for everyday photos',
    description:
      'Use film-inspired grades without crushing skin tones. Learn how intensity, contrast, and grain work together in Pixora’s cinematic filter lab.',
    excerpt:
      'A cinematic look is not one LUT slammed to 100%. These practical grading rules keep portraits, travel photos, and product shots believable.',
    publishedAt: '2026-11-18',
    updatedAt: '2026-11-18',
    author: 'Pixora Studio',
    category: 'Color Grading',
    readTime: '6 min read',
    coverGradient: 'from-[#202124] via-[#5F6368] to-[#FBBC04]',
    tags: ['cinematic filters', 'color grade', 'film look'],
    sections: [
      {
        heading: 'Grade after the image is already correct',
        paragraphs: [
          'Filters look expensive when the base photo is already exposed well. If highlights are clipped or the white balance is wildly off, a teal-and-orange grade will only advertise those problems.',
          'Start in the Photo Editor, then send the same document to Cinematic Filters. Pixora keeps the current image in the studio session so you are not re-uploading between tools.',
        ],
      },
      {
        heading: 'Intensity is the real craft',
        paragraphs: [
          'Most film and cinema looks should live between 35% and 70% intensity. That range keeps color in the shadows while still leaving room for the original scene. Push higher only on landscapes, night streets, or still life where skin is not the subject.',
        ],
        bullets: [
          'Portraits: keep intensity lower and watch the reds in skin.',
          'Architecture: cooler grades often feel more modern.',
          'Food and product: warmer grades usually sell texture better.',
          'Grain: a little bit hides digital smoothness; too much looks like noise.',
        ],
      },
      {
        heading: 'Save looks you will reuse',
        paragraphs: [
          'If you land on a stack you like, save it as a custom filter. That is how you keep a consistent series look across a wedding set, a store catalog, or a travel journal without rebuilding the recipe every time.',
        ],
      },
    ],
  },
  {
    slug: 'design-better-photo-collages',
    title: 'Design better photo collages: layout, spacing, and type',
    description:
      'Practical collage layout advice for grids, Polaroid stories, and scrapbook pages—including spacing, canvas size, and when to add text.',
    excerpt:
      'Collages fall apart when every photo shouts at once. Use a hierarchy, consistent gaps, and one canvas size so the page reads as a single piece.',
    publishedAt: '2026-11-21',
    updatedAt: '2026-11-21',
    author: 'Pixora Studio',
    category: 'Collage',
    readTime: '8 min read',
    coverGradient: 'from-[#34A853] via-[#4285F4] to-[#EA4335]',
    tags: ['collage maker', 'layout', 'print'],
    sections: [
      {
        heading: 'Pick a canvas before you pick a vibe',
        paragraphs: [
          'A square canvas is natural for Instagram. A 4:5 or 2:3 canvas is closer to a printed page. A wide 16:9 canvas is better for desktop wallpapers and YouTube thumbs. If you change the canvas after placing ten photos, you will spend the rest of the session fighting the crop.',
          'Pixora’s collage maker includes multiple canvas sizes and fifteen layouts so you can lock that decision early.',
        ],
      },
      {
        heading: 'Give the eye one hero frame',
        paragraphs: [
          'Even in a grid, one image should carry more visual weight—larger, brighter, or placed on a stronger axis. The supporting frames then become context: detail shots, textures, or a second moment from the same afternoon.',
        ],
        bullets: [
          'Keep gaps consistent. Mixed padding looks accidental.',
          'Align edges to the layout, then nudge only if a face is getting cropped.',
          'Use Polaroid and scrapbook frames when the story is personal; use tight grids for catalogs.',
          'Add text last, and only if the collage needs a date, place, or short caption.',
        ],
      },
      {
        heading: 'Export for the destination',
        paragraphs: [
          'If the collage is going to print, export PNG or a high-quality JPEG at the canvas’s full pixel size. If it is going to a website, run the export through the image compressor and keep a copy of the full-resolution file.',
        ],
      },
    ],
  },
  {
    slug: 'compress-images-for-the-web-without-visible-damage',
    title: 'Compress images for the web without visible damage',
    description:
      'Choose JPEG, WebP, PNG, or AVIF with a target file size, and learn which settings keep photographs sharp while shrinking pages.',
    excerpt:
      'Heavy images slow down landing pages and blogs. Use format, dimensions, and quality together so compression stays invisible.',
    publishedAt: '2026-11-24',
    updatedAt: '2026-11-24',
    author: 'Pixora Studio',
    category: 'Performance',
    readTime: '6 min read',
    coverGradient: 'from-[#FBBC04] via-[#34A853] to-[#4285F4]',
    tags: ['image compressor', 'web performance', 'webp'],
    sections: [
      {
        heading: 'Resize before you squeeze',
        paragraphs: [
          'A 6000-pixel photo compressed to 80% quality is still a large download if you only display it at 1200 pixels. Set the longest edge to the size you actually need, then choose a format.',
          'Pixora’s batch compressor can resize, convert, and ZIP a whole set so a blog index or product grid does not ship camera originals.',
        ],
      },
      {
        heading: 'Format cheatsheet',
        paragraphs: [],
        bullets: [
          'JPEG: photographs with lots of continuous tone. Start around quality 78–88.',
          'WebP: usually smaller than JPEG at a similar look. Use it for modern websites.',
          'AVIF: even smaller on many photos, with slower encode time.',
          'PNG: logos, screenshots, and anything that needs a clean alpha channel.',
        ],
      },
      {
        heading: 'Judge compression on a real preview',
        paragraphs: [
          'Look at edges, small type, and skin. If those hold, the file is small enough. If you see banding in skies or muddy fabric, raise quality a little or stop shrinking the dimensions. The goal is a file that looks identical at the size it will be viewed, not a trophy for the lowest kilobyte count.',
        ],
      },
    ],
  },
  {
    slug: 'remove-backgrounds-privately-with-on-device-ai',
    title: 'Remove backgrounds privately with on-device AI',
    description:
      'Cut a subject out in the browser, export a transparent PNG, or swap a backdrop—without sending the photo to a background-removal API.',
    excerpt:
      'Subject isolation is useful for marketplaces, presentations, and composites. Doing it on-device means the original never leaves the computer.',
    publishedAt: '2026-11-25',
    updatedAt: '2026-11-25',
    author: 'Pixora Studio',
    category: 'Background Removal',
    readTime: '5 min read',
    coverGradient: 'from-[#EA4335] via-[#4285F4] to-[#34A853]',
    tags: ['background remover', 'png', 'on-device ai'],
    sections: [
      {
        heading: 'What local segmentation is good at',
        paragraphs: [
          'On-device models are strong on clear subjects: a person against a wall, a product on a table, a plant in a pot. Hair, smoke, and fine mesh are harder. Give the model contrast and a reasonably sharp file rather than a tiny social-media screenshot.',
        ],
      },
      {
        heading: 'Transparent PNG vs a new backdrop',
        paragraphs: [
          'Export a transparent PNG when you still need to composite later in the photo editor or collage maker. Choose a solid color or gradient when you need a marketplace-ready cutout immediately. If you swap in another photo as a backdrop, match the light direction or the composite will look pasted.',
        ],
        bullets: [
          'Use PNG when you need alpha.',
          'Keep a copy of the original in case you want a different edge later.',
          'First-run model download happens locally in the browser; later cuts are faster.',
        ],
      },
      {
        heading: 'A clean finishing pass',
        paragraphs: [
          'After the cutout, open the image in the Photo Editor if the subject needs a slight contrast bump or a color match against the new background. Then compress only the final deliverable, not the transparent master, if you still need an alpha channel.',
        ],
      },
    ],
  },
];

export function getAllPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
