package com.github.laplusijns;

import java.util.concurrent.TimeUnit;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "jocb")
public class JocbProperties {

    private TextTimeout textTimeout = new TextTimeout();
    private ImageTimeout imageTimeout = new ImageTimeout();
    private Boolean enableThumbnail = Boolean.FALSE;
    private Integer sizeThumbnail = 300;

    public TextTimeout getTextTimeout() {
        return textTimeout;
    }

    public void setTextTimeout(final TextTimeout textTimeout) {
        this.textTimeout = textTimeout;
    }

    public ImageTimeout getImageTimeout() {
        return imageTimeout;
    }

    public void setImageTimeout(final ImageTimeout imageTimeout) {
        this.imageTimeout = imageTimeout;
    }

    public Boolean getEnableThumbnail() {
        return enableThumbnail;
    }

    public void setEnableThumbnail(final Boolean enableThumbnail) {
        this.enableThumbnail = enableThumbnail;
    }

    public Integer getSizeThumbnail() {
        return sizeThumbnail;
    }

    public void setSizeThumbnail(final Integer sizeThumbnail) {
        this.sizeThumbnail = sizeThumbnail;
    }

    public static class TimeoutBase {
        private long value = 20;
        private long maxSize = 128;
        private TimeUnit unit = TimeUnit.MINUTES;

        public long getValue() {
            return value;
        }

        public void setValue(final long value) {
            this.value = value;
        }

        public long getMaxSize() {
            return maxSize;
        }

        public void setMaxSize(final long maxSize) {
            this.maxSize = maxSize;
        }

        public TimeUnit getUnit() {
            return unit;
        }

        public void setUnit(final TimeUnit unit) {
            this.unit = unit;
        }
    }

    public static class TextTimeout extends TimeoutBase {}

    public static class ImageTimeout extends TimeoutBase {}
}
