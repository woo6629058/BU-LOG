package com.bulog.domain.exhibit.client;

import com.bulog.domain.exhibit.exception.ExhibitException;
import com.bulog.domain.exhibit.exception.code.ExhibitErrorCode;
import java.net.URI;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
@Slf4j
public class EmuseumClient {

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
        this.imageClient = restClientBuilder.clone().build();
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
            MediaType contentType = response.getHeaders().getContentType();
            return new EmuseumImage(
                    contentType == null ? MediaType.APPLICATION_OCTET_STREAM : contentType,
                    response.getBody() == null ? new byte[0] : response.getBody()
            );
        } catch (ExhibitException exception) {
            throw exception;
        } catch (IllegalArgumentException | RestClientException exception) {
            log.warn("e뮤지엄 이미지 조회 실패: {}", exception.getClass().getSimpleName());
            throw new ExhibitException(ExhibitErrorCode.EMUSEUM_UNAVAILABLE);
        }
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
