package com.github.laplusijns.ocr;

import com.github.laplusijns.ImageCache;
import com.github.laplusijns.LabelAndValue;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.function.Supplier;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.content.Content;
import org.springframework.ai.content.Media;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

@Endpoint
@AnonymousAllowed
public class OcrEndpointService {

    ImageCache imageCache;
    Optional<ChatModel> chatModel;
    private final Map<String, Sinks.Many<OcrResponse>> channels = new ConcurrentHashMap<>();
    ExecutorService executorService;

    public OcrEndpointService(
            final ImageCache imageCache, final Optional<ChatModel> chatModel, final ExecutorService ocrExecutor) {
        super();
        this.imageCache = imageCache;
        this.chatModel = chatModel;
        this.executorService = ocrExecutor;
    }

    @NonNull
    public List<@NonNull LabelAndValue> lvs() {
        return imageCache.all().stream()
                .map(t -> new LabelAndValue(t.uuid() + "  (" + t.originalFilename() + ")", t.uuid()))
                .toList();
    }

    @NonNull
    public Flux<@NonNull OcrResponse> ocrResponseSubscription(final String jsessionid) {
        final Sinks.Many<OcrResponse> sink =
                channels.computeIfAbsent(jsessionid, _ -> Sinks.many().unicast().onBackpressureBuffer());
        return sink.asFlux().doFinally(_ -> cleanUp(jsessionid));
    }

    private void cleanUp(final String jsessionid) {
        final Sinks.Many<OcrResponse> sink = channels.remove(jsessionid);
        if (sink != null) {
            sink.tryEmitComplete();
        }
    }

    private void send(final OcrResponse message, final String jsessionid) {
        final Sinks.Many<OcrResponse> sink = channels.get(jsessionid);
        if (sink != null) {
            sink.tryEmitNext(message);
        }
    }

    public void ocrImageCache(@NonNull final String uuid, @NonNull final String jsessionid) {
        runOcr(
                () -> new ByteArrayResource(imageCache.file(uuid).bytes()),
                imageCache.file(uuid).contentType(),
                jsessionid);
    }

    public void ocrImageFile(@NonNull final MultipartFile file, final String jsessionid) {
        try {
            final byte[] bytes = file.getBytes();
            final String contentType = file.getContentType();
            runOcr(() -> new ByteArrayResource(bytes), contentType, jsessionid);
        } catch (Exception e) {
            send(OcrResponse.error(e.getMessage()), jsessionid);
        }
    }

    private void runOcr(
            final Supplier<Resource> resourceSupplier, @Nullable final String contentType, final String jsessionid) {
        executorService.execute(() -> {
            try {
                final Resource resource = resourceSupplier.get();

                final UserMessage.Builder builder = UserMessage.builder().text("解析圖中文字並輸出原始文字以及分行，不要額外符號或說明");

                if (contentType != null) {
                    builder.media(new Media(MimeTypeUtils.parseMimeType(contentType), resource));
                }

                final ChatModel model =
                        chatModel.orElseThrow(() -> new IllegalStateException("ChatModel not configured"));

                final ChatResponse response = model.call(new Prompt(builder.build()));
                final String text = Optional.ofNullable(response.getResult())
                        .map(Generation::getOutput)
                        .map(Content::getText)
                        .orElseThrow(() -> new NoSuchElementException("AI No Response"));

                send(OcrResponse.success(text.replaceAll("\\n{2,}", "\n")), jsessionid);

            } catch (Exception e) {
                send(OcrResponse.error(e.getMessage()), jsessionid);
            }
        });
    }
}
