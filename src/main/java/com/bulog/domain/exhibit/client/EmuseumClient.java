package com.bulog.domain.exhibit.client;

import com.bulog.domain.exhibit.exception.ExhibitException;
import com.bulog.domain.exhibit.exception.code.ExhibitErrorCode;
import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
@Slf4j
public class EmuseumClient {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(10);

    private final RestClient apiClient;
    private final RestClient imageClient;
    private final EmuseumProperties properties;
    private final EmuseumXmlParser xmlParser;

    public EmuseumClient(
            RestClient.Builder restClientBuilder,
            EmuseumProperties properties,
            EmuseumXmlParser xmlParser
    ) {
        this.apiClient = restClientBuilder.clone().baseUrl(properties.baseUrl()).build();
        this.imageClient = createImageClient(restClientBuilder);
        this.properties = properties;
        this.xmlParser = xmlParser;
    }

    public EmuseumPage getExhibits(int pageNumber, int pageSize) {
        requireServiceKey();
        try {
            String response = apiClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/list")
                            .queryParam("serviceKey", properties.serviceKey())
                            .queryParam("museumCode", properties.institutionCode())
                            .queryParam("numOfRows", pageSize)
                            .queryParam("pageNo", pageNumber)
                            .build())
                    .accept(MediaType.APPLICATION_XML)
                    .retrieve()
                    .body(String.class);
            return xmlParser.parseList(response);
        } catch (ExhibitException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new ExhibitException(ExhibitErrorCode.EMUSEUM_UNAVAILABLE);
        }
    }

    public EmuseumImage getImage(String imageUrl) {
        try {
            URI imageUri = URI.create(imageUrl);
            validateImageUri(imageUri);
            ResponseEntity<byte[]> response = imageClient.get()
                    .uri(imageUri)
                    .accept(MediaType.IMAGE_JPEG, MediaType.IMAGE_PNG)
                    .retrieve()
                    .toEntity(byte[].class);
            return validateImageResponse(response);
        } catch (ExhibitException exception) {
            throw exception;
        } catch (IllegalArgumentException | RestClientException exception) {
            log.warn("e뮤지엄 이미지 조회 실패: {}", exception.getClass().getSimpleName());
            throw new ExhibitException(ExhibitErrorCode.EMUSEUM_UNAVAILABLE);
        }
    }

    private RestClient createImageClient(RestClient.Builder restClientBuilder) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(CONNECT_TIMEOUT)
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(READ_TIMEOUT);
        return restClientBuilder.clone()
                .requestFactory(requestFactory)
                .build();
    }

    static EmuseumImage validateImageResponse(ResponseEntity<byte[]> response) {
        byte[] content = response.getBody();
        MediaType detectedContentType = detectImageType(content);
        if (!response.getStatusCode().is2xxSuccessful()
                || detectedContentType == null) {
            throw new ExhibitException(ExhibitErrorCode.EMUSEUM_UNAVAILABLE);
        }
        return new EmuseumImage(detectedContentType, content);
    }

    private static MediaType detectImageType(byte[] content) {
        if (isJpeg(content)) {
            return MediaType.IMAGE_JPEG;
        }
        if (isPng(content)) {
            return MediaType.IMAGE_PNG;
        }
        return null;
    }

    private static boolean isJpeg(byte[] content) {
        return content != null
                && content.length >= 3
                && (content[0] & 0xFF) == 0xFF
                && (content[1] & 0xFF) == 0xD8
                && (content[2] & 0xFF) == 0xFF;
    }

    private static boolean isPng(byte[] content) {
        int[] signature = {0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        if (content == null || content.length < signature.length) {
            return false;
        }
        for (int index = 0; index < signature.length; index++) {
            if ((content[index] & 0xFF) != signature[index]) {
                return false;
            }
        }
        return true;
    }

    private void validateImageUri(URI imageUri) {
        boolean supportedScheme = "http".equalsIgnoreCase(imageUri.getScheme())
                || "https".equalsIgnoreCase(imageUri.getScheme());
        boolean supportedHost = "www.emuseum.go.kr".equalsIgnoreCase(imageUri.getHost())
                || "emuseum.go.kr".equalsIgnoreCase(imageUri.getHost());
        boolean supportedPath = "/openapi/img".equals(imageUri.getPath());
        if (!supportedScheme || !supportedHost || !supportedPath) {
            throw new ExhibitException(ExhibitErrorCode.EMUSEUM_UNAVAILABLE);
        }
    }

    private void requireServiceKey() {
        if (!properties.hasServiceKey()) {
            throw new ExhibitException(ExhibitErrorCode.EMUSEUM_NOT_CONFIGURED);
        }
    }
}
