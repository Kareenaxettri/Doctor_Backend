// Task, Create a CRUD application to simulate api behaviour/functions
// make use of list function, promise, async-await
// let products = [
//     { id: 101, name: "Laptiop", price: 50000 },
//     { id: 102, name: "Mobile", price: 20000 },
//     { id: 103, name: "Tablet", price: 30000 },
//     { id: 104, name: "Monitor", price: 15000 }
// ]
// your application should be 6 functions to perform CRUD operations using Promise
// 1. createProduct 
// -- takes product object as argument and add to products array
// -- check if id is present, if yes, reject with error
// -- if name is missing, replace with "Unknown Product" 
// -- if price is missing, replace with 0
// 2. getProducts, 
// -- returns all products after 2 seconds delay using Promise
// 3. getProductById, 
// -- takes id as argument and returns product with that id after 1 second delay 
// using Promise, if not found, reject with error
// 4. searchProduct,
// -- takes name as argument and returns all products that match the name
// 5. updateProduct, 
// -- takes id and update object as arguments, 
// finds product by id and updates it with the update object, 
// if not found, reject with error
// 6. deleteProduct
// -- takes id as argument and deletes product with that id,
// if not found, reject with error, if deleted, resolve with success message


// run this application using, 
// npm run start-mock-db

let products = [
    { id: 101, name: "Laptop", price: 50000 },
    { id: 102, name: "Mobile", price: 20000 },
    { id: 103, name: "Tablet", price: 30000 },
    { id: 104, name: "Monitor", price: 15000 }
];

// 1. CREATE
function createProduct(newProduct) {
    return new Promise((resolve, reject) => {
        let exists = products.find(p => p.id === newProduct.id);

        if (exists) {
            return reject("Product with this ID already exists");
        }

        newProduct.name = newProduct.name || "Unknown Product";
        newProduct.price = newProduct.price || 0;

        products.push(newProduct);
        resolve("Product added successfully");
    });
}

// 2. GET ALL (2 sec delay)
function getProducts() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(products);
        }, 2000);
    });
}

// 3. GET BY ID (1 sec delay)
function getProductById(id) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let product = products.find(p => p.id === id);
            if (!product) {
                return reject("Product not found");
            }
            resolve(product);
        }, 1000);
    });
}

// 4. SEARCH
function searchProduct(name) {
    return new Promise((resolve) => {
        let result = products.filter(p =>
            p.name.toLowerCase().includes(name.toLowerCase())
        );
        resolve(result);
    });
}

// 5. UPDATE
function updateProduct(id, updateObj) {
    return new Promise((resolve, reject) => {
        let product = products.find(p => p.id === id);

        if (!product) {
            return reject("Product not found");
        }

        Object.assign(product, updateObj);
        resolve("Product updated successfully");
    });
}

// 6. DELETE
function deleteProduct(id) {
    return new Promise((resolve, reject) => {
        let index = products.findIndex(p => p.id === id);

        if (index === -1) {
            return reject("Product not found");
        }

        products.splice(index, 1);
        resolve("Product deleted successfully");
    });
}


// --------- USING ASYNC/AWAIT ---------
async function runApp() {
    try {
        await createProduct({ id: 105, name: "Keyboard" });

        let all = await getProducts();
        console.log("All Products:", all);

        let one = await getProductById(101);
        console.log("Single Product:", one);

        let search = await searchProduct("mobile");
        console.log("Search Result:", search);

        await updateProduct(102, { price: 25000 });

        await deleteProduct(103);

        console.log("Final Products:", await getProducts());

    } catch (err) {
        console.log("Error:", err);
    }
}

runApp();