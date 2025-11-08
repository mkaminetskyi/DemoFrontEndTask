package com.demo.demotaskforfeside.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PriceListItem(
        String article,
        String name,
        String storageUnit,
        String brand,
        BigDecimal price,
        String priceText
) {
}
