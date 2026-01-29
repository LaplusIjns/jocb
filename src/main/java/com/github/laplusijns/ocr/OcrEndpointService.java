package com.github.laplusijns.ocr;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import org.jspecify.annotations.NonNull;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.content.Media;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.multipart.MultipartFile;

import com.github.laplusijns.FileObject;
import com.github.laplusijns.ImageCache;
import com.github.laplusijns.LabelAndValue;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;

@Endpoint
@AnonymousAllowed
public class OcrEndpointService {

    ImageCache imageCache;
    Optional<ChatModel> chatModel;

    public OcrEndpointService(final ImageCache imageCache, final Optional<ChatModel> chatModel) {
        super();
        this.imageCache = imageCache;
        this.chatModel = chatModel;
    }

    @NonNull
    public List<@NonNull LabelAndValue> lvs() {
        return imageCache.all().stream()
                .map(t -> new LabelAndValue(t.uuid() + "  (" + t.originalFilename() + ")", t.uuid()))
                .toList();
    }

    @NonNull
    public OcrResponse ocrImageCache(@NonNull final String uuid) {
        try {
            final FileObject fileObject = imageCache.file(uuid);
            final byte[] bs = imageCache.file(uuid).bytes();
            final Resource resource = new ByteArrayResource(bs);
            final var userMessage = UserMessage.builder()
                    .media(new Media(MimeTypeUtils.parseMimeType(fileObject.contentType()), resource))
                    .text("解析圖中文字並輸出原始文字以及分行，不要額外符號或說明")
                    .build();
            if (chatModel.isEmpty()) {
                return OcrResponse.error("NOT implement");
            }
            final ChatResponse response = chatModel.get().call(new Prompt(userMessage));
            final Generation generation = response.getResult();
            if (generation != null) {
                final String text = generation.getOutput().getText();
                if (text != null) {
                    return OcrResponse.success(text.replaceAll("\\n{2,}", "\n"));
                }
            }
            throw new NoSuchElementException("AI No Response");
        } catch (Exception e) {
            return OcrResponse.error(e.getMessage());
        }
    }

    @NonNull
    public OcrResponse ocrImageFile(@NonNull final MultipartFile file) {
        try {
            final Resource resource = new InputStreamResource(file.getInputStream());
            var userMessageBuilder = UserMessage.builder();
			if (file.getContentType() instanceof String contentType) {
				userMessageBuilder.media(new Media(MimeTypeUtils.parseMimeType(contentType), resource));
			}
			final var userMessage = userMessageBuilder.text("解析圖中文字並輸出原始文字以及分行，不要額外符號或說明").build();
            if (chatModel.isEmpty()) {
                return OcrResponse.error("NOT implement");
            }

            final ChatResponse response = chatModel.get().call(new Prompt(userMessage));
            final Generation generation = response.getResult();
            if (generation != null) {
                final String text = generation.getOutput().getText();
                if (text != null) {
                    return OcrResponse.success(text.replaceAll("\\n{2,}", "\n"));
                }
            }
            throw new NoSuchElementException("AI No Response");
        } catch (Exception e) {
            return OcrResponse.error(e.getMessage());
        }
    }
}
