<template>
	<header>
		<div class="header-bar">
			<h2>Images from {{table}}</h2>
			<button @click="goBack">&lt; Back</button>
		</div>
	</header>
	<private-view :title="title">
		<div class="gallery">
			<input
					type="file"
					ref="imageUpload"
					multiple
					accept="image/*"
					@change="onImageUpload"
					style="display: none;"
			/>
			<div class="buttons">
				<button class="select-images-btn" @click="$refs.imageUpload.click()">Select Images</button>
				<button class="upload-images-btn" @click="uploadImages" :disabled="thumbnails.length === 0">Upload Images</button>
			</div>
			<div class="uploaded-thumbnails">
				<div
						v-for="(thumbnail, index) in thumbnails"
						:key="index"
						class="thumbnail-container"
						@click="removeImage(index)"
				>
					<img :src="thumbnail.url" class="thumbnail" />
					<div class="thumbnail-remove">Remove</div>
				</div>
			</div>
			<div v-if="loading" class="loading">Loading...</div>
			<div v-else>
				<div class="image-list" ref="imageList">
					<div
							v-for="(image, index) in paginatedImages"
							:key="image.image"
							class="image-item"
							:data-index="(currentPage - 1) * imagesPerPage + index"
							draggable="true"
							@dragstart="onDragStart"
							@dragover.prevent
							@drop="onDrop"
					>
						<img :src="image.image.replace('.jpg', 't.jpg')" />
					</div>

				</div>
				<custom-pagination
						v-if="totalImages > imagesPerPage"
						:total="totalImages"
						:limit="imagesPerPage"
						:page.sync="currentPage"
						@pagination="handlePagination"
				/>  </div>
		</div>
	</private-view>
</template>

<script>
	import axios from 'axios';
	import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
	import CustomPagination from './CustomPagination.vue';


	async function wasabi(rid,table) {
		let bucket = ['img.ragalahari.com', 'media.ragalahari.com', 'starzone.ragalahari.com', 'imgcdn.ragalahari.com',
			'www1.ragalahari.com', 'imgcdn.raagalahari.com', 'img.raagalahari.com', 'timg.raagalahari.com', 'szcdn.ragalahari.com', 'www.ragalahari.com','szcdn1.ragalahari.com']
		//'gallery.ragalahari.com',media1.ragalahari.com,74.52.160.190,media1.ragalahari.com,www.ragalahari.net,www.telugudvdshop.com
//`wasabi` is null

		const response = await axios.get(`/items/${table}?filter={"rid":${rid}}&fields=rid,permaLink,imageName`);
		let v = response.data.data[0]
		if(!v) return
		return await run(v);

		async function run(val) {
			let selPath = table == 'movies_poster'?'fileLocation':'path'
			const response2 = await axios.get(`/items/${table}?filter={"rid":${val.rid}}&fields=${selPath}`);
			let obj = response2.data.data[0]
			if (obj.hasOwnProperty('fileLocation')) {
				obj['path'] = obj['fileLocation'];
				delete obj['path'];
			}
			if (obj?.path) {
				let Origin = obj.path.replace(/http:\/\//gi, '').split('/')
				let bucketName = Origin[0] == bucket[0] || Origin[0] == bucket[3] || Origin[0] == bucket[4] ||
				Origin[0] == bucket[5] || Origin[0] == bucket[6] || Origin[0] == bucket[7] ? bucket[0] : Origin[0] == bucket[1] || Origin[0] == bucket[9] ? bucket[1] :
						Origin[0] == bucket[2] || Origin[0] == bucket[8] || Origin[0] == bucket[10] ? bucket[2] : 'noFile';

				let remove = bucket.concat('http:///').concat('Http:///')
				let prefix = obj.path

				if (prefix == 'http://www.ragalahari.com/images/') {
					prefix = 'gallery/' + val.imageName + '/'
				} else {
					remove.map(v => {
						prefix = prefix.replace(v, '')
					})
				}
				console.log( bucketName, prefix)
				if (bucketName != 'noFile') {
					return  {
						Bucket: bucketName,
						Prefix: prefix
					};
				} else {
					return {}
				}
			}
		}

	}
	export default  {
		components: {
			CustomPagination,
		},
		data() {
			return {
				loading: true,
				images: [],
				table:'Loading',
				title:'Loading',
				wasabiIds: [],
				currentPage: 1,
				imagesPerPage: 5,
				totalImages: 0,
				draggedItem: null,
				thumbnails: [],
			};
		},
		async created() {
			this.fetchImages();
		},
		computed: {
			paginatedImages() {
				const startIndex = (this.currentPage - 1) * this.imagesPerPage;
				const endIndex = startIndex + this.imagesPerPage;
				return this.images.slice(startIndex, endIndex);
			},
		},
		methods: {
			async fetchImages() {
				const id = this.$route.query.id;
				const loc = this.$route.query.loc;
				if (id) {
					try {
						const response = await axios.get(`/items/${loc}?filter={"rid":${id}}&fields=wasabi,rid,title`);
						let res = response.data.data[0]
						if(!res) return this.loading = false;
						if (res.wasabi.length !== 0) {
							const response2 = await axios.get(`http://localhost:8055/items/wasabi`, {
								params: {
									filter: {
										id: {
											_in: res.wasabi,
										},
									},
									fields: 'image',
									// limit: this.imagesPerPage,
									// offset: (this.currentPage - 1) * this.imagesPerPage,
								},
							});
							const wasabiIds =  JSON.parse(res.wasabi);
							this.images = response2.data.data.map((imageObj, index) => ({
								...imageObj,
								id: wasabiIds[index],
							}));
							this.title = res.title

							this.table = loc?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

							console.log(this.images,'gg')
							this.totalImages = response2.data.data.length;

							// this.images = response2.data.data;
							// this.wasabiIds =response.data.data[0].wasabi;
							// this.totalImages = response2.data.data.length;
						}
					} catch (error) {
						console.error('Error fetching images:', error);
					} finally {
						this.loading = false;
					}
				}
			},
			handlePagination(page) {
				this.currentPage = page;
			},
			onDragStart(e) {
				this.draggedItem = e.target.closest('.image-item');
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/plain', this.draggedItem.dataset.index);
			},
			onDrop(e) {
				e.preventDefault();
				const target = e.target.closest('.image-item');
				if (target && this.draggedItem !== target) {
					const fromIndex = parseInt(this.draggedItem.dataset.index);
					const toIndex = parseInt(target.dataset.index);
					const draggedImageData = this.images.splice(fromIndex, 1)[0];
					this.images.splice(toIndex, 0, draggedImageData);
					this.onDragEnd({ fromIndex, toIndex });
				}
			},
			onDragEnd({ fromIndex, toIndex }) {
				// Handle logic after dragging ends, e.g., update the order in the database
				console.log(`Moved item from index ${fromIndex} to index ${toIndex}`);
				const updatedWasabiIds = this.images.map((image) => image.id);
				console.log('Updated wasabiIds:', updatedWasabiIds);
			},
			goBack() {
				// Navigate to the previous page or a specific route
				this.$router.go(-1);
			},
			async onImageUpload(e) {
				const files = e.target.files;
				this.thumbnails = [];
				for (const file of files) {
					const thumbnail = await this.createThumbnail(file);
					// Store both the data URL and the original File object
					this.thumbnails.push({ url: thumbnail, file });
				}
			},
			createThumbnail(file) {
				return new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = (e) => {
						const img = new Image();
						img.src = e.target.result;
						img.onload = () => {
							const canvas = document.createElement('canvas');
							const ctx = canvas.getContext('2d');
							const scaleFactor = 300 / img.width;
							canvas.width = 300;
							canvas.height = img.height * scaleFactor;

							ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
							const thumbnail = canvas.toDataURL();
							resolve(thumbnail);
						};
					};
					reader.onerror = (e) => {
						reject(e);
					};
					reader.readAsDataURL(file);
				});
			},
			async uploadImages() {
				if (this.thumbnails.length === 0) {
					return;
				}

				try {
					// Add your access keys
					const accessKeyId = '1WSIWHRURHJVMWHLU1FE';
					const secretAccessKey = 'WTpchaqGTymsFA5JG3zKhIJRrS5P0hHThT88wNbJ';

					// Configure the S3 client
					const s3 = new S3Client({
						region: 'us-east-1',
						credentials: {
							accessKeyId,
							secretAccessKey,
						},
						endpoint: 'https://s3.wasabisys.com',
					});
					const id = this.$route.query.id;
					const loc = this.$route.query.loc;
					let params = await wasabi(id,loc)

					// Upload images
					const uploads = this.thumbnails.map(async (thumbnail, index) => {
						// Get the original file name without the extension
						const fileNameWithoutExtension = thumbnail.file.name.replace(/\.[^/.]+$/, '');

						// Set the object keys for the original image and the thumbnail
						const originalKey = `${params.Prefix}${fileNameWithoutExtension}.jpg`;
						const thumbnailKey = `${params.Prefix}${fileNameWithoutExtension}t.jpg`;

						// Convert the original file to an ArrayBuffer
						const originalArrayBuffer = await new Promise((resolve, reject) => {
							const reader = new FileReader();
							reader.onload = () => resolve(reader.result);
							reader.onerror = (error) => reject(error);
							reader.readAsArrayBuffer(thumbnail.file);
						});

						// Convert the thumbnail data URL to a Blob
						const thumbnailBlob = await (async () => {
							const response = await fetch(thumbnail.dataURL);
							return response.blob();
						})();

						// Convert the thumbnail Blob to an ArrayBuffer
						const thumbnailArrayBuffer = await new Promise((resolve, reject) => {
							const reader = new FileReader();
							reader.onload = () => resolve(reader.result);
							reader.onerror = (error) => reject(error);
							reader.readAsArrayBuffer(thumbnailBlob);
						});

						// Create the parameters for the original image and the thumbnail
						const originalParams = {
							Bucket: params.Bucket,
							Key: originalKey,
							Body: new Uint8Array(originalArrayBuffer),
							ContentType: thumbnail.file.type,
						};

						const thumbnailParams = {
							Bucket: params.Bucket,
							Key: thumbnailKey,
							Body: new Uint8Array(thumbnailArrayBuffer),
							ContentType:thumbnail.file.type,
						};

						// Upload the original image and the thumbnail
						const putObjectCommands = [
							new PutObjectCommand(originalParams),
							new PutObjectCommand(thumbnailParams),
						];

						await Promise.all(putObjectCommands.map((command) => s3.send(command)));
					});

					await Promise.all(uploads);
					this.thumbnails = [];
					alert('Images and thumbnails uploaded successfully!');
				} catch (error) {
					console.error('Error uploading images:', error);
					alert('Failed to upload images. Please try again.');
				}
			},
			removeImage(index) {
				this.thumbnails.splice(index, 1);
			},
		},
	};
</script>


<style>
	.gallery {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.image-list {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 4px;
		width: 100%;
	}
	.image-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.image-title {
		margin-top: 8px;
		font-size: 14px;
		font-weight: bold;
	}
	/* Add the header bar styles */
	.header-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #00c897;
		color: white;
		padding: 10px 16px;
	}
	.header-bar h2 {
		margin: 0;
	}
	.header-bar button {
		background-color: transparent;
		border: none;
		color: white;
		cursor: pointer;
		font-size: 16px;
	}
	.header-bar button:hover {
		text-decoration: underline;
	}
	.uploaded-thumbnails {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin: 8px 0;
	}

	.buttons {
		display: flex;
		justify-content: center;
		gap: 16px;
		margin: 16px 0;
	}

	.select-images-btn,
	.upload-images-btn {
		background-color: #00c897;
		border: none;
		color: white;
		cursor: pointer;
		font-size: 16px;
		padding: 8px 16px;
		transition: background-color 0.2s;
	}

	.select-images-btn:hover,
	.upload-images-btn:hover {
		background-color: #008e68;
	}

	.upload-images-btn:disabled {
		background-color: #8e8e8e;
		cursor: not-allowed;
	}

	.upload-images-btn:disabled:hover {
		background-color: #8e8e8e;
	}

	.thumbnail-container {
		position: relative;
		width: 100px;
		height: auto;
	}

	.thumbnail {
		width: 100%;
		height: auto;
		object-fit: cover;
	}

	.thumbnail-remove {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		background-color: rgba(0, 0, 0, 0.6);
		color: white;
		font-size: 12px;
		text-align: center;
		padding: 2px 0;
		cursor: pointer;
		display: none;
	}

	.thumbnail-container:hover .thumbnail-remove {
		display: block;
	}
</style>
