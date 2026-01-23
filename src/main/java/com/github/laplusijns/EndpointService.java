package com.github.laplusijns;

import com.github.laplusijns.JocbProperties.ImageTimeout;
import com.github.laplusijns.JocbProperties.TextTimeout;
import com.vaadin.flow.i18n.I18NProvider;
import com.vaadin.flow.server.VaadinService;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;
import com.vaadin.hilla.EndpointSubscription;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.web.multipart.MultipartFile;

@Endpoint
@AnonymousAllowed
public class EndpointService {

    ImageCache imageCache;
    TextCache textCache;
    I18NProvider i18nProvider;
    private List<LocaleInfo> localeInfos;
    Boolean enableThumbnail;
    Integer sizeThumbnail;
    TextTimeout textTimeout;
    ImageTimeout imageTimeout;

    public EndpointService(
            final ImageCache imageCache,
            final TextCache textCache,
            final I18NProvider i18nProvider,
            final JocbProperties jocbProperties) {
        super();
        this.imageCache = imageCache;
        this.textCache = textCache;
        this.i18nProvider = i18nProvider;
        this.localeInfos = i18nProvider.getProvidedLocales().stream()
                .map(t -> new LocaleInfo(t.getDisplayLanguage(t), t.toString()))
                .toList();
        this.enableThumbnail = jocbProperties.getEnableThumbnail();
        this.sizeThumbnail = jocbProperties.getSizeThumbnail();
        this.textTimeout = jocbProperties.getTextTimeout();
        this.imageTimeout = jocbProperties.getImageTimeout();
    }

    @NonNull
    public String uploadFile(@NonNull final MultipartFile file) throws IOException {

        final String uuid = UUID.randomUUID().toString();
        final String contentType = file.getContentType();
        final byte[] fileBytes = file.getBytes();

        Integer width = null;
        Integer height = null;
        FileObject.Thumbnail thumbnail = null;

        final BufferedImage image = ImageIO.read(new ByteArrayInputStream(fileBytes));

        if (image != null) {
            width = image.getWidth();
            height = image.getHeight();
            if (Boolean.TRUE.equals(enableThumbnail)) {
                thumbnail = createThumbnail(image);
            }
        }

        final long expired = System.currentTimeMillis() + imageTimeout.getUnit().toMillis(imageTimeout.getValue());

        final FileObject fileObject = new FileObject(
                expired, file.getOriginalFilename(), fileBytes, uuid, width, height, contentType, thumbnail);

        imageCache.put(fileObject);

        return "%s_%d_%s".formatted(file.getOriginalFilename(), file.getSize(), uuid);
    }

    @NonNull
    public List<@NonNull LocaleInfo> locales() {
        return localeInfos;
    }

    @Nullable
    public FileObject downloadFile(final String uuid) {
        return imageCache.file(uuid);
    }

    @NonNull
    public Collection<@NonNull String> downloadFileStrs() {
        return imageCache.keys();
    }

    public void deleteFile(@NonNull final String uuid) {
        imageCache.delete(uuid);
    }

    public void deleteAllFiles() {
        imageCache.deleteAllFiles();
    }

    @NonNull
    public TextObject uploadText(@NonNull final String text) {
        final long expired = System.currentTimeMillis() + textTimeout.getUnit().toMillis(textTimeout.getValue());
        final TextObject textObject = new TextObject(expired, text);
        textCache.put(textObject);
        return textObject;
    }

    public void deleteText(@NonNull final String text) {
        textCache.delete(text);
    }

    public void deleteAllTexts() {
        textCache.deleteAllTexts();
    }

    @NonNull
    public Collection<@NonNull TextObject> downloadTexts() {
        return textCache.keys();
    }

    @NonNull
    public String contextPath() {
        return VaadinService.getCurrentRequest().getContextPath();
    }

    @NonNull
    public EndpointSubscription<@NonNull List<@NonNull ImageCacheEvent>> subscribeImageUpdates() {
        return EndpointSubscription.of(imageCache.sub(), () -> {});
    }

    @NonNull
    public EndpointSubscription<@NonNull List<@NonNull TextCacheEvent>> subscribeTextUpdates() {
        return EndpointSubscription.of(textCache.sub(), () -> {});
    }

    private FileObject.Thumbnail createThumbnail(final BufferedImage original) throws IOException {
        final int MAX_SIZE = this.sizeThumbnail;

        final int originalWidth = original.getWidth();
        final int originalHeight = original.getHeight();

        final float scale = Math.min((float) MAX_SIZE / originalWidth, (float) MAX_SIZE / originalHeight);

        final int thumbWidth = Math.round(originalWidth * scale);
        final int thumbHeight = Math.round(originalHeight * scale);

        final BufferedImage thumbnailImage = new BufferedImage(thumbWidth, thumbHeight, BufferedImage.TYPE_INT_RGB);

        final Graphics2D g2d = thumbnailImage.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.drawImage(original, 0, 0, thumbWidth, thumbHeight, null);
        g2d.dispose();

        final ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(thumbnailImage, "jpg", baos);

        return new FileObject.Thumbnail(thumbWidth, thumbHeight, baos.toByteArray());
    }
}
