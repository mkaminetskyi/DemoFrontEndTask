// package com.demo.demotaskforfeside.controller;

// import lombok.extern.slf4j.Slf4j;
// import org.springframework.http.ResponseEntity;
// import org.springframework.stereotype.Controller;
// import org.springframework.ui.Model;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.PostMapping;
// import org.springframework.web.bind.annotation.ResponseBody;

// import java.util.ArrayList;
// import java.util.HashMap;
// import java.util.List;
// import java.util.Map;

// @Slf4j
// @Controller
// public class AIChatController {

//     @GetMapping("/ai-chat")
//     public String aiChatPage(Model model) {
//         return "/pages/ai-chat/ai-chat";
//     }

//     @ResponseBody
//     @PostMapping(value = "/ai-chat/chat")
//     public ResponseEntity<Map<String, Object>> chat() {
//         Map<String, Object> response = new HashMap<>();

//         response.put("answer", "Пропоную підбірку драбин різних типів і брендів для побутових та професійних робіт. Є компактні приставні (APRO), багатофункціональні шарнірні (DETEX), довгі 3‑секційні та трансформери. Скажіть потрібну висоту або спосіб використання — підберу оптимальний варіант.");

//         List<Map<String, String>> products = new ArrayList<>();

//         Map<String, String> product1 = new HashMap<>();
//         product1.put("name", "Драбина APRO алюмінієва приставна 7 сходинок (довжина загальна 1,95м)");
//         product1.put("article", "552000");
//         product1.put("manufacturer", "APRO");
//         product1.put("brand", "APRO");
//         product1.put("description", "Матеріал алюміній Висота 1,95 м Вага, кг 2,9 кг Максимальне навантаження 150 кг");
//         products.add(product1);

//         Map<String, String> product2 = new HashMap<>();
//         product2.put("name", "Драбина алюмінієва DETEX шарнірна 2х10, загальна довжина=580см, макс. вага до 150кг");
//         product2.put("article", "DLH-2s10");
//         product2.put("manufacturer", "<Пустая ссылка: Справочник.Виробник>");
//         product2.put("brand", "Detex");
//         product2.put("description", "Драбина багатоцільового призначення має 8 варіантів трансформації. Складається з 12 щаблів (сходинок) розділених на 4 секції. Витримує навантаження 150 кг. Висота для платформи 95 см. Довжина розкладеної 3,6м. Габарити складеної: 1х0,4х0,3м. Вага: 12,1кг. Щаблі (30х30мм) та опорні ніжки траверси мають протиковзні властивості. Виготовлена в Україні з високоякісного алюмінієвого профілю та фурнітури.");
//         products.add(product2);

//         Map<String, String> product3 = new HashMap<>();
//         product3.put("name", "Драбина розкладна 3-х секційна 3х12 сходинки (8,50м), 16,2кг, навантаження 150кг");
//         product3.put("article", "05-01-0071");
//         product3.put("manufacturer", "Товари України");
//         product3.put("brand", "Драбини");
//         product3.put("description", "Драбина розкладна 3-секційна 3×12 сходинок (8,50 м), 16,2 кг, навантаження 150 кг — міцна та зручна драбина для робіт на великій висоті. Може використовуватися як приставна або розкладна конструкція, виготовлена з легкого матеріалу, витримує навантаження до 150 кг, підходить для побутового й професійного використання.");
//         products.add(product3);

//         Map<String, String> product4 = new HashMap<>();
//         product4.put("name", "Драбина металева MAX 4-х сходинкова, h=127см, максимальна вага до 150кг, широкі сходинки");
//         product4.put("article", "2104");
//         product4.put("manufacturer", "Євроголд Індестріз ЛТД ІП");
//         product4.put("brand", "EUROGOLD");
//         product4.put("description", "Побутова драбина MAX — практична та зручна у користуванні. Ребриста поверхня її сходинок протидіє ковзанню стопи на їхній поверхні, а двокомпонентні захисні опори - ковзанню самої драбини по підлозі, забезпечуючи стійкість та стабільність положення. Захисне епоксидне покриття робить виріб більш зносостійким, а зручна система складання забезпечує компактність та легкість у зберіганні. Вага: 6,6 кг Розмір у складеному стані: 142 х 47,5 х 6 см Витримує вагу: до 150 кг Кількість сходинок: 4 Висота в розкладеному стані: 127 см Розмір сходинки: 30 х 20 см");
//         products.add(product4);

//         Map<String, String> product5 = new HashMap<>();
//         product5.put("name", "Драбина трансформер 4*4 (4,31 м) (без платформи), 11,2кг, навантаження 150кг");
//         product5.put("article", "EN131");
//         product5.put("manufacturer", "Товари України");
//         product5.put("brand", "Драбини");
//         product5.put("description", "Драбина алюмінієва трансформер використовується в процесі виконання широкого спектру будівельних, ремонтних, монтажних або побутових робіт на висоті.");
//         products.add(product5);

//         response.put("products", products);

//         return ResponseEntity.ok(response);
//     }
// }


package com.demo.demotaskforfeside.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Slf4j
@Controller
public class AIChatController {
    private static final String MOCKED_CHAT_RESPONSE = """
            Пропоную підбірку драбин різних типів і брендів для побутових та професійних робіт. Є компактні приставні (APRO), багатофункціональні шарнірні (DETEX), довгі 3‑секційні та трансформери. Скажіть потрібну висоту або спосіб використання — підберу оптимальний варіант.

            1. Драбина APRO алюмінієва приставна 7 сходинок (довжина загальна 1,95м)
            Артикул: 552000
            Виробник: APRO
            Бренд: APRO
            Опис: Матеріал алюміній Висота 1,95 м Вага, кг 2,9 кг Максимальне навантаження 150 кг
            2. Драбина алюмінієва DETEX шарнірна 2х10, загальна довжина=580см, макс. вага до 150кг
            Артикул: DLH-2s10
            Виробник: <Пустая ссылка: Справочник.Виробник>
            Бренд: Detex
            Драбина багатоцільового призначення має 8 варіантів трансформації. Складається з 12 щаблів (сходинок) розділених на 4 секції. Витримує навантаження 150 кг. Висота для платформи 95 см. Довжина розкладеної 3,6м. Габарити складеної: 1х0,4х0,3м. Вага: 12,1кг. Щаблі (30х30мм) та опорні ніжки траверси мають протиковзні властивості. Виготовлена в Україні з високоякісного алюмінієвого профілю та фурнітури.
            3. Драбина розкладна 3-х секційна 3х12 сходинки (8,50м), 16,2кг, навантаження 150кг
            Артикул: 05-01-0071
            Виробник: Товари України
            Бренд: Драбини
            Драбина розкладна 3-секційна 3×12 сходинок (8,50 м), 16,2 кг, навантаження 150 кг — міцна та зручна драбина для робіт на великій висоті. Може використовуватися як приставна або розкладна конструкція, виготовлена з легкого матеріалу, витримує навантаження до 150 кг, підходить для побутового й професійного використання.
            4. Драбина металева MAX 4-х сходинкова, h=127см, максимальна вага до 150кг, широкі сходинки
            Артикул: 2104
            Виробник: Євроголд Індестріз ЛТД ІП
            Бренд: EUROGOLD
            Побутова драбина MAX — практична та зручна у користуванні. Ребриста поверхня її сходинок протидіє ковзанню стопи на їхній поверхні, а двокомпонентні захисні опори - ковзанню самої драбини по підлозі, забезпечуючи стійкість та стабільність положення. Захисне епоксидне покриття робить виріб більш зносостійким, а зручна система складання забезпечує компактність та легкість у зберіганні. Вага: 6,6 кг Розмір у складеному стані: 142 х 47,5 х 6 см Витримує вагу: до 150 кг Кількість сходинок: 4 Висота в розкладеному стані: 127 см Розмір сходинки: 30 х 20 см
            5. Драбина трансформер 4*4 (4,31 м) (без платформи), 11,2кг, навантаження 150кг
            Артикул: EN131
            Виробник: Товари України
            Бренд: Драбини
            Опис: Драбина алюмінієва трансформер використовується в процесі виконання широкого спектру будівельних, ремонтних, монтажних або побутових робіт на висоті.
            """;

    @GetMapping("/ai-chat")
    public String aiChatPageOld(Model model) {
        return "/pages/ai-chat/ai-chat";
    }

    @GetMapping("/ai-chat-new")
    public String aiChatPageNew(Model model) {
        return "/pages/ai-chat/ai-chat-new";
    }

    @ResponseBody
    @PostMapping(value = "/ai-chat/chat")
    public ResponseEntity<String> chat() {
        return ResponseEntity.ok(MOCKED_CHAT_RESPONSE);
    }
}
