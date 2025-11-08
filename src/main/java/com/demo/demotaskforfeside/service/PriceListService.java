package com.demo.demotaskforfeside.service;

import com.demo.demotaskforfeside.dto.PriceListItem;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@Service
public class PriceListService {

    private static final String PRICE_LIST_RESOURCE_PATH = "classpath:data/pricelist.json";

    private final ObjectMapper objectMapper;
    private final ResourceLoader resourceLoader;

    public PriceListService(ObjectMapper objectMapper, ResourceLoader resourceLoader) {
        this.objectMapper = objectMapper;
        this.resourceLoader = resourceLoader;
    }

    public List<PriceListItem> loadPriceList() {
        Resource resource = resourceLoader.getResource(PRICE_LIST_RESOURCE_PATH);
        try (InputStream inputStream = resource.getInputStream()) {
            return objectMapper.readValue(inputStream, new TypeReference<>() {
            });
        } catch (IOException e) {
            throw new IllegalStateException("Unable to load price list", e);
        }
    }
}
