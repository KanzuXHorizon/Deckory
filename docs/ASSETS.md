# Deckory Local Asset Pipeline

Deckory assets là dữ liệu có type ở cấp deck. Deck document không tải ảnh remote trong runtime và không nhúng đường dẫn máy cá nhân. Mọi ảnh dùng lại được khai báo trong `deck.assets`, sau đó component tham chiếu bằng `assetId` ổn định.

## Asset manifest

```ts
import { defineDeck } from "@deckory/schema";

export const deck = defineDeck({
  id: "product-story",
  version: 1,
  title: "Product story",
  locale: "vi-VN",
  themeId: "product-story",
  assets: [
    {
      id: "product-lead-avatar",
      type: "image",
      src: "/team/avatar-product.svg",
      mediaType: "image/svg+xml",
      source: {
        label: "Ảnh minh hoạ nội bộ"
      }
    }
  ],
  slides: [
    {
      id: "team",
      layout: "process",
      components: [
        {
          id: "team-profile",
          type: "team-showcase",
          props: {
            variant: "profile",
            members: [
              {
                id: "product-lead",
                name: "Product Lead",
                image: {
                  assetId: "product-lead-avatar",
                  alt: "Chân dung minh hoạ Product Lead",
                  position: "top"
                }
              }
            ]
          }
        }
      ]
    }
  ]
});
```

## Contract

Asset ảnh hỗ trợ:

- ID kebab-case duy nhất trong deck;
- local public path bắt đầu bằng `/` hoặc inline `data:image/...`;
- `mediaType`: PNG, JPEG, WebP, GIF hoặc SVG;
- `width` và `height` tùy chọn nhưng phải xuất hiện cùng nhau;
- metadata nguồn tùy chọn với label và URL HTTPS.

Runtime source không cho phép:

- `http://` hoặc `https://` trong `src`;
- protocol-relative URL;
- backslash;
- `..` path traversal;
- query string hoặc fragment;
- đường dẫn Windows/local machine.

`source.url` chỉ là metadata evidence; renderer không tải URL này.

## Team image

`team-showcase.members[].image` phải chứa đúng một trong:

```ts
{ assetId: "product-lead-avatar", alt: "..." }
```

hoặc:

```ts
{ src: "/team/avatar-product.svg", alt: "..." }
```

Ưu tiên `assetId` khi ảnh được dùng lại hoặc cần được audit. Direct `src` phù hợp với fixture nhỏ, nhưng vẫn phải là local/data image hợp lệ.

Studio Inspector hỗ trợ cả Asset ID và local path. Khi nhập một giá trị, giá trị còn lại được xoá để giữ contract loại trừ lẫn nhau.

## Validation

`validateDeck` chặn:

- duplicate asset ID;
- unsafe/remote source;
- chỉ có width hoặc height;
- team image chứa cả `src` và `assetId` hoặc không chứa giá trị nào;
- component tham chiếu asset ID không tồn tại.

Diagnostic chỉ rõ deck, slide, component, member, property path, expected value và remediation.

## Filesystem quality gate

```bash
pnpm assets:check
pnpm assets:check -- --json
```

Gate kiểm tra mọi deck trong catalog:

- local file tồn tại dưới `apps/present/public`;
- resolved path không thoát public root;
- extension khớp `mediaType`;
- asset được ít nhất một component tham chiếu;
- mọi reference có entry trong manifest.

CI chạy gate này sau schema/deck audit.

## Renderer coverage

Manifest được truyền vào cùng `SlideFrame` ở:

- Hub thumbnails;
- Studio navigator và canvas;
- Preview/Presenter;
- overview và next-slide preview;
- audience view;
- PNG/PDF export.

Nếu một document chưa validate vẫn thiếu asset runtime, renderer dùng monogram an toàn thay vì render URL sai hoặc ảnh vỡ.

## Giới hạn hiện tại

- Asset type hiện chỉ hỗ trợ image; font/video/audio chưa có contract.
- Studio chưa upload hoặc copy file vào `public`; người tạo deck phải thêm file local vào repository trước.
- Chưa tạo hash/integrity hoặc image optimization derivative.
- Inline data images được schema hỗ trợ nhưng nên dùng tiết chế vì làm deck document lớn.
