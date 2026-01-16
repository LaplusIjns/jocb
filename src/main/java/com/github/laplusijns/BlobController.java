package com.github.laplusijns;

import java.nio.charset.StandardCharsets;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/blob")
public class BlobController {

    ImageCache imageCache;
    long imageMaxAge;

    public BlobController(final ImageCache imageCache, final JocbProperties jocbProperties) {
        super();
        this.imageCache = imageCache;
        this.imageMaxAge = jocbProperties
                .getImageTimeout()
                .getUnit()
                .toSeconds(jocbProperties.getImageTimeout().getValue());
    }

    @GetMapping("/{uuid}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable final String uuid) {
        final FileObject file = imageCache.file(uuid);
        if (file == null) {
            return ResponseEntity.notFound().build();
        }
        final ContentDisposition contentDisposition = ContentDisposition.builder("attachment")
                .filename(file.originalFilename(), StandardCharsets.UTF_8) // 自動處理非 ASCII 字元
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CACHE_CONTROL, "max-age="+imageMaxAge+", immutable")
                .body(file.bytes());
    }
}
