package com.github.laplusijns;

import com.vaadin.flow.i18n.I18NProvider;
import com.vaadin.flow.server.VaadinService;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;
import com.vaadin.hilla.EndpointSubscription;
import java.awt.image.BufferedImage;
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

    public EndpointService(final ImageCache imageCache, final TextCache textCache, final I18NProvider i18nProvider) {
        super();
        this.imageCache = imageCache;
        this.textCache = textCache;
        this.i18nProvider = i18nProvider;
        this.localeInfos = i18nProvider.getProvidedLocales().stream()
                .map(t -> new LocaleInfo(t.getDisplayLanguage(t), t.toString()))
                .toList();
    }

    @NonNull
    public String uploadFile(@NonNull final MultipartFile file) throws IOException {

        final String uuid = UUID.randomUUID().toString();
        final BufferedImage image = ImageIO.read(file.getInputStream());
        Integer width = null;
        Integer height = null;
        if (image != null) {
            width = image.getWidth();
            height = image.getHeight();
        }
        final FileObject fileObject =
                new FileObject(file.getOriginalFilename(), file.getBytes(), uuid, width, height, file.getContentType());
        imageCache.put(fileObject);
        return file.getOriginalFilename() + '_' + file.getSize() + '_' + uuid;
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

    public void uploadText(@NonNull final String text) {
        textCache.put(text);
    }

    public void deleteText(@NonNull final String text) {
        textCache.delete(text);
    }

    public void deleteAllTexts() {
        textCache.deleteAllTexts();
    }

    @NonNull
    public Collection<@NonNull String> downloadTexts() {
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
}
